const { Pool } = require('pg');
require('dotenv').config();

const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllRecentActivity() {
  console.log('🔍 Checking ALL recent transcription activity...\n');
  
  try {
    // Check all recent meetings
    console.log('📋 Recent Meetings (last 30 minutes):');
    const recentMeetings = await renderPool.query(`
      SELECT * FROM conversation.block_meetings 
      WHERE created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${recentMeetings.rows.length} recent meetings:`);
    for (const meeting of recentMeetings.rows) {
      console.log(`\n  Bot ID: ${meeting.recall_bot_id}`);
      console.log(`  Status: ${meeting.status}`);
      console.log(`  Created: ${meeting.created_at}`);
      console.log(`  Block ID: ${meeting.block_id}`);
    }
    
    // Check for ANY turns in the last 30 minutes
    console.log('\n💬 Recent Transcription Activity (last 30 minutes):');
    const recentTurns = await renderPool.query(`
      SELECT t.*, bt.block_id
      FROM conversation.turns t
      LEFT JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      WHERE t.created_at > NOW() - INTERVAL '30 minutes'
        AND t.source_type = 'recall_bot'
      ORDER BY t.created_at DESC
      LIMIT 20
    `);
    
    if (recentTurns.rows.length > 0) {
      console.log(`✅ Found ${recentTurns.rows.length} recent turns:`);
      recentTurns.rows.forEach(turn => {
        console.log(`  [${turn.created_at}] ${turn.content.substring(0, 100)}...`);
        console.log(`    Block: ${turn.block_id}, Has embedding: ${turn.content_vector ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('❌ No recent transcription activity found');
    }
    
    // Check WebSocket connection logs
    console.log('\n🔌 Any recall_bot source turns (all time):');
    const anyRecallTurns = await renderPool.query(`
      SELECT COUNT(*) as count FROM conversation.turns 
      WHERE source_type = 'recall_bot'
    `);
    
    console.log(`  Total recall_bot turns ever: ${anyRecallTurns.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error checking activity:', error.message);
  } finally {
    await renderPool.end();
  }
}

checkAllRecentActivity().catch(console.error);