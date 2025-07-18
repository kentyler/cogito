#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from recall-bot directory
dotenv.config({ path: path.join(__dirname, '../recall-bot/.env') });

const { Pool } = pg;
const db = {
    pool: new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
    })
};

async function rebuildTranscript(blockId) {
    try {
        // First check the meeting details
        console.log(`\n📋 Checking meeting details for block_id: ${blockId}\n`);
        
        const meetingQuery = `
            SELECT * FROM conversation.block_meetings
            WHERE block_id = $1
        `;
        
        const meetingResult = await db.pool.query(meetingQuery, [blockId]);
        
        if (meetingResult.rows.length === 0) {
            console.error('❌ No meeting found with this block_id');
            return;
        }
        
        const meeting = meetingResult.rows[0];
        console.log('✅ Meeting found:');
        console.log(`   - Transcript email: ${meeting.transcript_email}`);
        console.log(`   - Recall Bot ID: ${meeting.recall_bot_id}`);
        console.log(`   - Meeting URL: ${meeting.meeting_url}`);
        console.log(`   - Started: ${meeting.started_at}`);
        console.log(`   - Ended: ${meeting.ended_at}`);
        console.log(`   - Status: ${meeting.status}`);
        console.log(`   - Current transcript: ${meeting.full_transcript ? 'EXISTS' : 'EMPTY'}`);
        console.log(`   - Email sent: ${meeting.email_sent}`);
        
        // Now retrieve all turns for this meeting
        console.log('\n📝 Retrieving turns for this meeting...\n');
        
        const turnsQuery = `
            SELECT 
                bt.sequence_order,
                t.content as text,
                t.created_at,
                t.metadata
            FROM conversation.block_turns bt
            JOIN conversation.turns t ON bt.turn_id = t.turn_id
            WHERE bt.block_id = $1
            ORDER BY bt.sequence_order ASC
        `;
        
        const turnsResult = await db.pool.query(turnsQuery, [blockId]);
        
        if (turnsResult.rows.length === 0) {
            console.error('❌ No turns found for this meeting');
            return;
        }
        
        console.log(`✅ Found ${turnsResult.rows.length} turns\n`);
        
        // Rebuild the transcript
        console.log('🔨 Rebuilding transcript...\n');
        
        let transcript = '';
        let currentSpeaker = null;
        let speakerBuffer = '';
        
        for (const turn of turnsResult.rows) {
            // Extract speaker from metadata if available
            const speaker = turn.metadata?.speaker || 'Unknown';
            
            if (speaker !== currentSpeaker) {
                // Add previous speaker's content if exists
                if (currentSpeaker && speakerBuffer.trim()) {
                    transcript += `${currentSpeaker}: ${speakerBuffer.trim()}\n\n`;
                }
                // Start new speaker
                currentSpeaker = speaker;
                speakerBuffer = turn.text || '';
            } else {
                // Continue with same speaker
                speakerBuffer += ' ' + (turn.text || '');
            }
        }
        
        // Don't forget the last speaker's content
        if (currentSpeaker && speakerBuffer.trim()) {
            transcript += `${currentSpeaker}: ${speakerBuffer.trim()}\n\n`;
        }
        
        // Show a preview of the transcript
        console.log('📄 Transcript preview (first 500 chars):');
        console.log('---');
        console.log(transcript.substring(0, 500) + '...');
        console.log('---');
        console.log(`\nTotal transcript length: ${transcript.length} characters`);
        
        // Update the block_meetings table
        console.log('\n💾 Updating block_meetings table...');
        
        // Create a JSON object with the transcript
        const transcriptJson = {
            transcript: transcript,
            rebuilt_at: new Date().toISOString(),
            turn_count: turnsResult.rows.length
        };
        
        const updateQuery = `
            UPDATE conversation.block_meetings
            SET full_transcript = $1::jsonb
            WHERE block_id = $2
            RETURNING block_id
        `;
        
        const updateResult = await db.pool.query(updateQuery, [JSON.stringify(transcriptJson), blockId]);
        
        if (updateResult.rows.length > 0) {
            console.log('✅ Successfully updated transcript in block_meetings table');
        } else {
            console.error('❌ Failed to update transcript');
            return;
        }
        
        // Check if email was sent
        console.log('\n📧 Checking email status...');
        
        const emailQuery = `
            SELECT 
                email_sent,
                transcript_email
            FROM conversation.block_meetings
            WHERE block_id = $1
        `;
        
        const emailResult = await db.pool.query(emailQuery, [blockId]);
        const emailStatus = emailResult.rows[0];
        
        if (emailStatus.email_sent) {
            console.log(`✅ Email was already sent to: ${emailStatus.transcript_email}`);
        } else {
            console.log(`⚠️  Email was not sent to: ${emailStatus.transcript_email}`);
            console.log('\n💡 To send the email, you may need to:');
            console.log('   1. Check if the email service is running');
            console.log('   2. Manually trigger the email sending');
            console.log('   3. Check the recall-bot/thinking-tools.js for email functionality');
            console.log('\n📧 The transcript has been successfully rebuilt and is now available in the database.');
        }
        
        console.log('\n✅ Transcript rebuild complete!');
        
    } catch (error) {
        console.error('❌ Error rebuilding transcript:', error);
    } finally {
        await db.pool.end();
    }
}

// Get block_id from command line
const blockId = process.argv[2];

if (!blockId) {
    console.error('Usage: node rebuild-transcript.js <block_id>');
    process.exit(1);
}

rebuildTranscript(blockId);