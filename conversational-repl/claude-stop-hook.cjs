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

async function captureClaudeSession() {
  try {
    // Read hook data from stdin
    const hookData = JSON.parse(fs.readFileSync(0, 'utf8'));
    const { session_id, transcript_path, cwd } = hookData;

    // Check if we already have a block for this session
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
        JSON.stringify({ session_id, cwd, transcript_path })
      ]);
      blockId = newBlock.rows[0].block_id;
      console.log(`✅ Created new Claude session block: ${blockId}`);
    } else {
      blockId = block.rows[0].block_id;
    }

    // Read the transcript to extract the latest exchange
    if (transcript_path && fs.existsSync(transcript_path)) {
      const transcript = fs.readFileSync(transcript_path, 'utf8');
      const exchanges = parseTranscriptForLatestExchange(transcript);
      
      if (exchanges.userPrompt && exchanges.claudeResponse) {
        // Create turns for user prompt and Claude response
        const userTurnId = uuidv4();
        const claudeTurnId = uuidv4();
        
        // Insert user turn
        await pool.query(`
          INSERT INTO conversation.turns (turn_id, content, source_type, metadata, timestamp, block_id, created_at)
          VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
        `, [userTurnId, exchanges.userPrompt, 'user_input', JSON.stringify({ session_id }), blockId]);

        // Insert Claude turn with slightly later timestamp to ensure ordering
        await pool.query(`
          INSERT INTO conversation.turns (turn_id, content, source_type, metadata, timestamp, block_id, created_at)
          VALUES ($1, $2, $3, $4, NOW() + interval '1 millisecond', $5, NOW())
        `, [claudeTurnId, exchanges.claudeResponse, 'claude_response', JSON.stringify({ session_id }), blockId]);

        console.log(`✅ Added exchange to Claude session block ${blockId}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in Claude stop hook:', error);
  } finally {
    await pool.end();
  }
}

// Parse transcript to extract the latest user prompt and Claude response
function parseTranscriptForLatestExchange(transcript) {
  // This is a simplified parser - you may need to adjust based on actual transcript format
  const lines = transcript.split('\n');
  let userPrompt = '';
  let claudeResponse = '';
  let currentSection = '';
  
  // Look for the latest exchange pattern
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    
    if (line.startsWith('> ')) {
      // User prompt
      if (!userPrompt) {
        userPrompt = line.substring(2);
        currentSection = 'user';
      }
    } else if (line && currentSection === 'user' && !claudeResponse) {
      // Claude response (first non-empty line after user prompt when going backwards)
      claudeResponse = line;
      break;
    }
  }
  
  return { userPrompt, claudeResponse };
}

// Run the hook
captureClaudeSession();