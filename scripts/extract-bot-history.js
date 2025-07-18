import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from recall-bot directory
dotenv.config({ path: path.join(__dirname, '../recall-bot/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const blockId = 'dd410787-1cae-48b6-8e1e-4a00f21d56f1';

async function extractBotHistory() {
  try {
    // Query to get bot participation (chat-question and claude responses)
    const query = `
      WITH bot_turns AS (
        -- Get all turns for this meeting
        SELECT 
          t.turn_id,
          t.participant_id,
          t.content,
          t.source_type,
          t.created_at,
          bt.sequence_order,
          p.name as participant_name,
          p.email as participant_email
        FROM conversation.block_meetings bm
        JOIN conversation.blocks b ON b.block_id = bm.block_id
        JOIN conversation.block_turns bt ON bt.block_id = b.block_id
        JOIN conversation.turns t ON t.turn_id = bt.turn_id
        LEFT JOIN conversation.participants p ON p.id = t.participant_id
        WHERE bm.block_id = $1
          AND t.source_type IN ('chat-question', 'claude')
        ORDER BY bt.sequence_order
      )
      SELECT * FROM bot_turns;
    `;

    const result = await pool.query(query, [blockId]);
    
    console.log(`\nBot Participation History for Meeting ${blockId}`);
    console.log('=' .repeat(80));
    console.log(`Found ${result.rows.length} bot interactions\n`);

    // Format and display results
    result.rows.forEach((turn, index) => {
      console.log(`[${index + 1}] ${turn.source_type.toUpperCase()}`);
      console.log(`Time: ${turn.created_at}`);
      console.log(`Sequence: ${turn.sequence_order}`);
      if (turn.participant_name) {
        console.log(`Participant: ${turn.participant_name} (${turn.participant_email || 'no email'})`);
      }
      console.log(`Content:\n${turn.content}`);
      console.log('-'.repeat(80));
    });

    // Also save to file
    const output = {
      meeting_block_id: blockId,
      bot_interactions: result.rows.map(turn => ({
        turn_id: turn.turn_id,
        source_type: turn.source_type,
        sequence_order: turn.sequence_order,
        participant: {
          id: turn.participant_id,
          name: turn.participant_name,
          email: turn.participant_email
        },
        content: turn.content,
        created_at: turn.created_at
      }))
    };

    // Write to JSON file
    const fs = await import('fs/promises');
    const filename = `meeting-bot-history-${blockId}.json`;
    await fs.writeFile(filename, JSON.stringify(output, null, 2));
    console.log(`\n✅ Bot history saved to ${filename}`);

  } catch (error) {
    console.error('Error extracting bot history:', error);
  } finally {
    await pool.end();
  }
}

extractBotHistory();