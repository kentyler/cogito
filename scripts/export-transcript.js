#!/usr/bin/env node

import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from recall-bot directory
dotenv.config({ path: path.join(__dirname, '../recall-bot/.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function exportTranscript(blockId) {
    try {
        // Get meeting details and transcript
        const query = `
            SELECT 
                bm.*,
                b.name as meeting_name
            FROM conversation.block_meetings bm
            LEFT JOIN conversation.blocks b ON b.block_id = bm.block_id
            WHERE bm.block_id = $1
        `;
        
        const result = await pool.query(query, [blockId]);
        
        if (result.rows.length === 0) {
            console.error('❌ No meeting found with this block_id');
            return;
        }
        
        const meeting = result.rows[0];
        
        if (!meeting.full_transcript) {
            console.error('❌ No transcript found for this meeting');
            return;
        }
        
        // Extract the transcript text
        let transcriptText = '';
        const transcriptData = meeting.full_transcript;
        
        if (transcriptData.transcript) {
            transcriptText = transcriptData.transcript;
        } else {
            transcriptText = JSON.stringify(transcriptData, null, 2);
        }
        
        // Create filename with meeting details
        const date = new Date(meeting.started_at).toISOString().split('T')[0];
        const filename = `julian_andrews_meeting_transcript_${date}.txt`;
        const filepath = `/mnt/c/Users/ken/Desktop/claudestuff/${filename}`;
        
        // Write the transcript
        fs.writeFileSync(filepath, `Meeting Transcript
==================
Meeting: ${meeting.meeting_name || 'Untitled Meeting'}
Date: ${new Date(meeting.started_at).toLocaleString()}
Participant Email: ${meeting.transcript_email}
Meeting URL: ${meeting.meeting_url}
==================

${transcriptText}`);
        
        console.log(`✅ Transcript exported to: ${filepath}`);
        
    } catch (error) {
        console.error('❌ Error exporting transcript:', error);
    } finally {
        await pool.end();
    }
}

exportTranscript('c713df66-18a2-4925-b8f2-3b1c3f03f678');