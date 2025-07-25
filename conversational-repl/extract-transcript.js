require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function extractTranscript() {
  try {
    const blockId = 'dd410787-1cae-48b6-8e1e-4a00f21d56f1';
    
    // Get all turns for this block
    const turnsResult = await pool.query(
      `SELECT 
        bt.sequence_order,
        t.turn_id,
        t.participant_id,
        t.content,
        t.source_type,
        t.created_at,
        t.metadata,
        p.name as participant_name
      FROM conversation.turns t
      LEFT JOIN conversation.participants p ON t.participant_id = p.id
      WHERE t.block_id = $1
      ORDER BY t.timestamp`,
      [blockId]
    );
    
    console.log('Total turns found:', turnsResult.rows.length);
    
    // Build transcript
    let transcript = '';
    let currentSpeaker = null;
    
    turnsResult.rows.forEach(turn => {
      // Skip chat interactions and claude responses for transcript
      if (turn.source_type === 'contextual-trigger' || 
          turn.source_type === 'claude-response' || 
          turn.source_type === 'chat-comment') {
        return;
      }
      
      const speaker = turn.participant_name || `Participant ${turn.participant_id}`;
      
      if (speaker !== currentSpeaker) {
        transcript += `\n\n${speaker}: `;
        currentSpeaker = speaker;
      }
      
      transcript += turn.content + ' ';
    });
    
    // Save to file
    const filename = `block_${blockId}_transcript.txt`;
    fs.writeFileSync(filename, transcript.trim());
    
    console.log('\nTranscript saved to:', filename);
    console.log('\nFirst 2000 characters of transcript:');
    console.log(transcript.substring(0, 2000) + '...');
    
    // Also get block info
    const blockResult = await pool.query(
      'SELECT * FROM conversation.blocks WHERE block_id = $1',
      [blockId]
    );
    
    if (blockResult.rows.length > 0) {
      console.log('\n\nBlock information:');
      console.log('- Name:', blockResult.rows[0].name);
      console.log('- Description:', blockResult.rows[0].description);
      console.log('- Block Type:', blockResult.rows[0].block_type);
      console.log('- Created:', blockResult.rows[0].created_at);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

extractTranscript();