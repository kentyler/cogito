#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fetch = require('node-fetch');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Set search path for schema access
pool.on('connect', (client) => {
  client.query('SET search_path = public, conversation, client_mgmt, tools');
});

async function checkStuckMeetings() {
  console.log('🔍 Checking for stuck meetings...\n');
  
  try {
    // Find meetings that might be stuck
    const result = await pool.query(`
      SELECT 
        bm.block_id,
        bm.recall_bot_id,
        bm.transcript_email,
        bm.meeting_url,
        bm.email_sent,
        bm.status,
        bm.created_at,
        b.name as meeting_name,
        EXTRACT(EPOCH FROM (NOW() - bm.created_at))/60 as minutes_old
      FROM conversation.block_meetings bm
      JOIN conversation.blocks b ON b.block_id = bm.block_id
      WHERE bm.status = 'joining' 
        AND bm.email_sent IS NOT TRUE
      ORDER BY bm.created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ No stuck meetings found!');
      return;
    }
    
    console.log(`Found ${result.rows.length} meetings in 'joining' status:\n`);
    
    for (const meeting of result.rows) {
      console.log(`📋 Meeting: ${meeting.meeting_name}`);
      console.log(`   Bot ID: ${meeting.recall_bot_id}`);
      console.log(`   Status: ${meeting.status} (for ${Math.round(meeting.minutes_old)} minutes)`);
      console.log(`   Email: ${meeting.transcript_email || 'NOT SET'}`);
      console.log(`   URL: ${meeting.meeting_url}`);
      
      // Check turn count
      const turnsResult = await pool.query(
        'SELECT COUNT(*) as count FROM conversation.block_turns WHERE block_id = $1',
        [meeting.block_id]
      );
      const turnCount = parseInt(turnsResult.rows[0].count);
      console.log(`   Transcript turns: ${turnCount}`);
      
      // Try to get actual status from Recall.ai
      try {
        const response = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
          headers: {
            'Authorization': `Token ${process.env.RECALL_API_KEY}`
          }
        });
        
        if (response.ok) {
          const botData = await response.json();
          console.log(`   Recall.ai status: ${botData.status}`);
          
          if (botData.status !== meeting.status) {
            console.log(`   ⚠️  Status mismatch! Database says '${meeting.status}' but Recall says '${botData.status}'`);
          }
        } else {
          console.log(`   ❌ Could not fetch Recall.ai status (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Error fetching Recall.ai status: ${error.message}`);
      }
      
      // Recommendations
      if (meeting.minutes_old > 10 && turnCount > 0) {
        console.log(`   🚨 RECOMMENDATION: This meeting appears stuck and has transcript data.`);
        console.log(`      Consider running: npm run force-send ${meeting.recall_bot_id}`);
      } else if (meeting.minutes_old > 60) {
        console.log(`   🚨 RECOMMENDATION: This meeting is over 1 hour old and likely abandoned.`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Command to force send a specific meeting
async function forceSend(botId) {
  if (!botId) {
    console.error('❌ Please provide a bot ID');
    process.exit(1);
  }
  
  console.log(`🚀 Attempting to force send transcript for bot ${botId}...\n`);
  
  try {
    // Get meeting info
    const result = await pool.query(`
      SELECT 
        bm.block_id,
        bm.transcript_email,
        bm.meeting_url,
        bm.email_sent,
        b.name as meeting_name
      FROM conversation.block_meetings bm
      JOIN conversation.blocks b ON b.block_id = bm.block_id
      WHERE bm.recall_bot_id = $1
    `, [botId]);
    
    if (result.rows.length === 0) {
      console.error('❌ Meeting not found');
      process.exit(1);
    }
    
    const meeting = result.rows[0];
    
    if (meeting.email_sent) {
      console.log('⚠️  Email already sent for this meeting');
      process.exit(0);
    }
    
    if (!meeting.transcript_email) {
      console.error('❌ No email address configured for this meeting');
      process.exit(1);
    }
    
    // Check turn count
    const turnsResult = await pool.query(
      'SELECT COUNT(*) as count FROM conversation.block_turns WHERE block_id = $1',
      [meeting.block_id]
    );
    const turnCount = parseInt(turnsResult.rows[0].count);
    
    if (turnCount === 0) {
      console.error('❌ No transcript data available');
      process.exit(1);
    }
    
    console.log(`📧 Meeting: ${meeting.meeting_name}`);
    console.log(`📧 Email to: ${meeting.transcript_email}`);
    console.log(`📧 Turns: ${turnCount}`);
    console.log('\n⚠️  This will send the transcript email. Continue? (y/N)');
    
    // Simple confirmation
    process.stdin.once('data', async (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        console.log('\n📤 Sending transcript...');
        console.log('Please use the API endpoint /api/force-send-transcript/:botId to send');
        console.log(`Example: POST https://your-server.com/api/force-send-transcript/${botId}`);
        console.log('\nOr update the email_sent flag manually:');
        console.log(`UPDATE conversation.block_meetings SET email_sent = TRUE WHERE recall_bot_id = '${botId}';`);
      } else {
        console.log('❌ Cancelled');
      }
      await pool.end();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];
const botId = process.argv[3];

if (command === 'force-send') {
  forceSend(botId);
} else {
  checkStuckMeetings();
}