#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment from the conversational-repl directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function capturePromptResponse() {
  try {
    // Read hook data from stdin
    const hookData = JSON.parse(fs.readFileSync(0, 'utf8'));
    const { session_id, transcript_path, hook_event_name } = hookData;
    
    console.error(`🔍 Stop hook triggered: session=${session_id}, transcript=${transcript_path}`);
    
    // Read the transcript file to get the conversation
    if (!transcript_path || !fs.existsSync(transcript_path)) {
      console.error('❌ No transcript file provided or file does not exist');
      process.exit(0);
    }
    
    const transcript = JSON.parse(fs.readFileSync(transcript_path, 'utf8'));
    
    // Get the last user message and agent response
    const messages = transcript.messages || [];
    if (messages.length < 2) {
      console.error('❌ Not enough messages in transcript');
      process.exit(0);
    }
    
    // Find the last user message and following assistant message
    let user_message = null;
    let agent_response = null;
    
    for (let i = messages.length - 2; i >= 0; i--) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        user_message = messages[i].content;
        agent_response = messages[i + 1].content;
        break;
      }
    }
    
    if (!user_message || !agent_response) {
      console.error('❌ Could not find user/assistant message pair');
      process.exit(0);
    }
    
    const cwd = process.cwd();

    // Create or get Claude session block
    let block = await pool.query(
      'SELECT block_id FROM conversation.blocks WHERE name = $1 AND block_type = $2',
      [`Claude Session ${session_id}`, 'claude_conversation']
    );

    let blockId;
    if (block.rows.length === 0) {
      // Create new block for this Claude session
      const newBlock = await pool.query(`
        INSERT INTO conversation.blocks (block_id, name, description, block_type, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING block_id
      `, [
        uuidv4(),
        `Claude Session ${session_id}`,
        `Claude Code conversation session started at ${new Date().toISOString()}`,
        'claude_conversation',
        JSON.stringify({ session_id, cwd, start_time: new Date().toISOString() })
      ]);
      blockId = newBlock.rows[0].block_id;
      console.error(`✅ Created new Claude session block: ${blockId}`);
    } else {
      blockId = block.rows[0].block_id;
    }

    // Create turns for user prompt and Claude response
    const userTurnId = uuidv4();
    const claudeTurnId = uuidv4();
    
    // Insert user turn
    await pool.query(`
      INSERT INTO conversation.turns (turn_id, content, source_type, metadata, timestamp, block_id, created_at)
      VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
    `, [userTurnId, user_message, 'user_input', JSON.stringify({ session_id, cwd }), blockId]);

    // Insert Claude turn with slightly later timestamp to ensure ordering
    await pool.query(`
      INSERT INTO conversation.turns (turn_id, content, source_type, metadata, timestamp, block_id, created_at)
      VALUES ($1, $2, $3, $4, NOW() + interval '1 millisecond', $5, NOW())
    `, [claudeTurnId, agent_response, 'claude_response', JSON.stringify({ session_id }), blockId]);

    console.error(`✅ Captured prompt/response pair for session ${session_id}`);

  } catch (error) {
    console.error('❌ Error in Claude stop hook:', error);
    // Exit with 0 to not block Claude's operation
    process.exit(0);
  } finally {
    await pool.end();
  }
}

// Run the hook
capturePromptResponse();