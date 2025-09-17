#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

const meetingId = '06737af8-1f12-4662-bfa5-50786f421385';

async function checkMeetingTurns() {
  const db = new DatabaseAgent();

  try {
    await db.connect();

    // Check meeting exists
    const meeting = await db.connector.query(
      `SELECT id, meeting_title, started_at, ended_at, full_transcript
       FROM meetings.meetings
       WHERE id = $1`,
      [meetingId]
    );

    if (meeting.rows.length === 0) {
      console.log(`❌ Meeting ${meetingId} not found`);
      return;
    }

    console.log('📋 Meeting Details:');
    console.log(`  ID: ${meeting.rows[0].id}`);
    console.log(`  Title: ${meeting.rows[0].meeting_title}`);
    console.log(`  Started: ${meeting.rows[0].started_at}`);
    console.log(`  Ended: ${meeting.rows[0].ended_at}`);
    console.log(`  Has transcript: ${meeting.rows[0].full_transcript ? 'Yes' : 'No'}`);

    // Check turns
    const turns = await db.connector.query(
      `SELECT id, content, speaker_name, created_at, source_type, directed_to
       FROM meetings.turns
       WHERE meeting_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [meetingId]
    );

    console.log(`\n📝 Turns found: ${turns.rows.length}`);

    // Count total turns
    const turnCount = await db.connector.query(
      `SELECT COUNT(*) as count FROM meetings.turns WHERE meeting_id = $1`,
      [meetingId]
    );

    console.log(`📊 Total turns for meeting: ${turnCount.rows[0].count}`);

    if (turns.rows.length > 0) {
      console.log('\n🔍 Recent turns:');
      turns.rows.forEach((turn, i) => {
        console.log(`\n  Turn ${i + 1}:`);
        console.log(`    Speaker: ${turn.speaker_name || 'Unknown'}`);
        console.log(`    Source: ${turn.source_type || 'conversation'}`);
        console.log(`    Directed to: ${turn.directed_to || 'None'}`);
        console.log(`    Time: ${turn.created_at}`);
        console.log(`    Content: ${turn.content.substring(0, 100)}${turn.content.length > 100 ? '...' : ''}`);
      });
    }

    // Check bot status
    const bot = await db.connector.query(
      `SELECT id, status, bot_id, last_activity
       FROM meetings.bots
       WHERE meeting_id = $1`,
      [meetingId]
    );

    if (bot.rows.length > 0) {
      console.log('\n🤖 Bot Status:');
      console.log(`  Bot ID: ${bot.rows[0].bot_id}`);
      console.log(`  Status: ${bot.rows[0].status}`);
      console.log(`  Last Activity: ${bot.rows[0].last_activity}`);
    } else {
      console.log('\n⚠️  No bot found for this meeting');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

checkMeetingTurns();