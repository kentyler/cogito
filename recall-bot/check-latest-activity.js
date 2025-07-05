const { Pool } = require('pg');
require('dotenv').config();

const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLatestActivity() {
  console.log('🔍 Checking for latest real-time transcription activity...\n');
  
  try {
    // Check the latest bot meeting
    console.log('📋 Latest Meeting:');
    const latestMeeting = await renderPool.query(`
      SELECT * FROM conversation.block_meetings 
      WHERE recall_bot_id = $1
    `, ['c8f9a34a-8a7c-4312-82aa-6277b2617505']);
    
    if (latestMeeting.rows.length > 0) {
      const meeting = latestMeeting.rows[0];
      console.log(`  Bot ID: ${meeting.recall_bot_id}`);
      console.log(`  Status: ${meeting.status}`);
      console.log(`  Block ID: ${meeting.block_id}`);
      
      // Check for any new turns in the last 5 minutes
      console.log('\n💬 Recent Transcription Activity:');
      const recentTurns = await renderPool.query(`
        SELECT t.*, bt.sequence_order 
        FROM conversation.turns t
        JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
        WHERE bt.block_id = $1 
          AND t.created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [meeting.block_id]);
      
      if (recentTurns.rows.length > 0) {
        console.log(`  ✅ Found ${recentTurns.rows.length} recent turns:`);
        recentTurns.rows.forEach(turn => {
          console.log(`    [${turn.created_at}] ${turn.content.substring(0, 100)}...`);
          console.log(`    Source: ${turn.source_type}, Has embedding: ${turn.content_vector ? 'YES' : 'NO'}`);
        });
      } else {
        console.log('  ❌ No recent transcription activity found');
        console.log('  This suggests WebSocket real-time transcription is not working');
      }
      
      // Check total turns for this meeting
      const totalTurns = await renderPool.query(`
        SELECT COUNT(*) as count FROM conversation.block_turns 
        WHERE block_id = $1
      `, [meeting.block_id]);
      
      console.log(`\n📊 Total turns in this meeting: ${totalTurns.rows[0].count}`);
      
    } else {
      console.log('  ❌ No meeting found for the latest bot');
    }
    
  } catch (error) {
    console.error('❌ Error checking activity:', error.message);
  } finally {
    await renderPool.end();
  }
}

checkLatestActivity().catch(console.error);