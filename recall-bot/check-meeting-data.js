const { Pool } = require('pg');
require('dotenv').config();

const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkMeetingData() {
  console.log('🔍 Checking meeting data for bot b41820a3-9996-4f5d-b222-4a225c7cda7b\n');
  
  try {
    // Check meeting status
    console.log('📋 Meeting Status:');
    const meeting = await renderPool.query(`
      SELECT * FROM conversation.block_meetings 
      WHERE recall_bot_id = $1
    `, ['b41820a3-9996-4f5d-b222-4a225c7cda7b']);
    
    if (meeting.rows.length > 0) {
      console.log('  ✅ Meeting found:', {
        block_id: meeting.rows[0].block_id,
        status: meeting.rows[0].status,
        started_at: meeting.rows[0].started_at,
        updated_at: meeting.rows[0].updated_at
      });
      
      const blockId = meeting.rows[0].block_id;
      
      // Check for attendees
      console.log('\n👥 Attendees:');
      const attendees = await renderPool.query(`
        SELECT * FROM conversation.block_attendees 
        WHERE block_id = $1
      `, [blockId]);
      
      console.log(`  Found ${attendees.rows.length} attendees:`);
      attendees.rows.forEach(attendee => {
        console.log(`    - ${attendee.name} (ID: ${attendee.id})`);
        console.log(`      Story: ${attendee.story}`);
      });
      
      // Check for turns (transcripts)
      console.log('\n💬 Transcripts/Turns:');
      const turns = await renderPool.query(`
        SELECT t.*, bt.sequence_order 
        FROM conversation.turns t
        JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
        WHERE bt.block_id = $1
        ORDER BY bt.sequence_order DESC
        LIMIT 10
      `, [blockId]);
      
      console.log(`  Found ${turns.rows.length} turns:`);
      turns.rows.forEach(turn => {
        console.log(`    [${turn.sequence_order}] ${turn.content.substring(0, 100)}...`);
        console.log(`        Source: ${turn.source_type}, Metadata:`, turn.metadata);
        console.log(`        Has embedding: ${turn.content_vector ? 'YES' : 'NO'}`);
      });
      
      // Check block_turns count
      console.log('\n📊 Block Turns Count:');
      const blockTurns = await renderPool.query(`
        SELECT COUNT(*) as count FROM conversation.block_turns 
        WHERE block_id = $1
      `, [blockId]);
      
      console.log(`  Total block_turns: ${blockTurns.rows[0].count}`);
      
    } else {
      console.log('  ❌ No meeting found with that bot ID');
    }
    
    // Check recent WebSocket activity (if any logs exist)
    console.log('\n🔌 Recent Activity:');
    const recentTurns = await renderPool.query(`
      SELECT t.content, t.source_type, t.created_at, t.metadata
      FROM conversation.turns t
      WHERE t.source_type = 'recall_bot' 
      ORDER BY t.created_at DESC 
      LIMIT 5
    `);
    
    console.log(`  Recent recall_bot turns: ${recentTurns.rows.length}`);
    recentTurns.rows.forEach(turn => {
      console.log(`    ${turn.created_at}: ${turn.content.substring(0, 80)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error checking meeting data:', error.message);
  } finally {
    await renderPool.end();
  }
}

checkMeetingData().catch(console.error);