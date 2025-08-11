#!/usr/bin/env node

/**
 * Rebuild Transcripts Script
 * Rebuilds full_transcript field for meetings that have turns but missing transcript data
 */

import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findMeetingsNeedingTranscripts() {
  const result = await pool.query(`
    SELECT 
      m.id,
      m.name,
      m.created_at,
      COUNT(t.id) as turn_count
    FROM meetings.meetings m
    LEFT JOIN meetings.turns t ON t.meeting_id = m.id
    WHERE (m.full_transcript IS NULL 
      OR m.full_transcript::text = 'null'
      OR m.full_transcript::text = '{}')
    GROUP BY m.id, m.name, m.created_at
    HAVING COUNT(t.id) > 0
    ORDER BY m.created_at DESC
  `);
  
  return result.rows;
}

async function buildTranscriptFromTurns(meetingId) {
  // Get all turns for the meeting, ordered chronologically
  const turnsResult = await pool.query(`
    SELECT 
      content,
      source_type,
      metadata,
      timestamp,
      created_at
    FROM meetings.turns 
    WHERE meeting_id = $1 
    ORDER BY created_at ASC
  `, [meetingId]);
  
  const turns = turnsResult.rows;
  
  if (turns.length === 0) {
    return null;
  }
  
  // Build transcript based on turn type
  let transcript = '';
  
  for (const turn of turns) {
    const timestamp = turn.timestamp || turn.created_at;
    const timeStr = timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    if (turn.source_type === 'chat') {
      // Chat/conversation turns
      const speakerLabel = turn.metadata?.speaker_label || 'Unknown Speaker';
      transcript += `\n[${speakerLabel} - ${timeStr}]:\n${turn.content}\n`;
      
    } else if (turn.source_type === 'transcript' || turn.source_type === 'audio') {
      // Audio transcript turns
      const speakerLabel = turn.metadata?.speaker_label || 'Unknown';
      transcript += `\n[${speakerLabel} - ${timeStr}]:\n${turn.content}\n`;
      
    } else {
      // Other turn types (system, etc.)
      const sourceType = turn.source_type || 'System';
      transcript += `\n[${sourceType} - ${timeStr}]:\n${turn.content}\n`;
    }
  }
  
  return transcript.trim();
}

async function updateMeetingTranscript(meetingId, transcript) {
  // Store as JSONB string value (the transcript itself as a JSON string)
  await pool.query(`
    UPDATE meetings.meetings 
    SET full_transcript = $2, updated_at = NOW()
    WHERE id = $1
  `, [meetingId, JSON.stringify(transcript)]);
}

async function rebuildTranscripts() {
  try {
    console.log('🔍 Finding meetings that need transcript rebuilding...');
    
    const meetingsToRebuild = await findMeetingsNeedingTranscripts();
    
    if (meetingsToRebuild.length === 0) {
      console.log('✅ No meetings need transcript rebuilding');
      return;
    }
    
    console.log(`📝 Found ${meetingsToRebuild.length} meetings to rebuild:`);
    console.table(meetingsToRebuild.map(m => ({
      name: m.name.substring(0, 40) + (m.name.length > 40 ? '...' : ''),
      turns: m.turn_count,
      created: m.created_at.toISOString().substring(0, 16)
    })));
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const meeting of meetingsToRebuild) {
      try {
        console.log(`\n🔨 Rebuilding transcript for: ${meeting.name}`);
        console.log(`   Meeting ID: ${meeting.id}`);
        console.log(`   Turns: ${meeting.turn_count}`);
        
        const transcript = await buildTranscriptFromTurns(meeting.id);
        
        if (!transcript) {
          console.log('   ⚠️  No valid turns found, skipping');
          continue;
        }
        
        await updateMeetingTranscript(meeting.id, transcript);
        
        console.log(`   ✅ Success! Transcript built (${transcript.length} characters)`);
        successCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed to rebuild transcript: ${error.message}`);
        failureCount++;
      }
    }
    
    console.log(`\n🎉 Transcript rebuilding complete!`);
    console.log(`   ✅ Successfully rebuilt: ${successCount} meetings`);
    console.log(`   ❌ Failed: ${failureCount} meetings`);
    
    if (successCount > 0) {
      console.log('\n📋 You can now test the transcript functionality in the admin interface');
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
rebuildTranscripts();