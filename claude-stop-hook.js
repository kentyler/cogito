#!/usr/bin/env node

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { FragmentExtractionAgent } from './lib/fragment-extraction-agent.js';
import dotenv from 'dotenv';

// Load environment from the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function capturePromptResponse() {
  const debugLog = [];
  
  try {
    // Read hook data from stdin
    const hookDataRaw = fs.readFileSync(0, 'utf8');
    debugLog.push(`📥 Raw hook data: ${hookDataRaw}`);
    
    const hookData = JSON.parse(hookDataRaw);
    const { session_id, transcript_path, hook_event_name, cwd } = hookData;
    
    debugLog.push(`🔍 Hook triggered:`);
    debugLog.push(`  - session_id: ${session_id}`);
    debugLog.push(`  - transcript_path: ${transcript_path}`);
    debugLog.push(`  - hook_event_name: ${hook_event_name}`);
    debugLog.push(`  - cwd: ${cwd}`);
    debugLog.push(`  - __dirname: ${__dirname}`);
    debugLog.push(`  - process.cwd(): ${process.cwd()}`);
    
    // Check if transcript file exists and process it
    if (!transcript_path) {
      debugLog.push('❌ No transcript_path provided');
    } else {
      debugLog.push(`📁 Checking transcript at: ${transcript_path}`);
      if (fs.existsSync(transcript_path)) {
        const stats = fs.statSync(transcript_path);
        debugLog.push(`✅ Transcript file exists (${stats.size} bytes)`);
        
        try {
          // Parse JSONL format (each line is a separate JSON object)
          const transcriptData = fs.readFileSync(transcript_path, 'utf8');
          const lines = transcriptData.trim().split('\n').filter(line => line.trim());
          debugLog.push(`📝 Transcript contains ${lines.length} JSONL lines`);
          
          if (lines.length >= 2) {
            // Parse the last few lines to see structure
            const recentMessages = lines.slice(-3).map((line, i) => {
              try {
                const parsed = JSON.parse(line);
                debugLog.push(`  ${i}: [${parsed.role || 'unknown'}] ${(parsed.content || JSON.stringify(parsed)).substring(0, 50)}...`);
                return parsed;
              } catch (e) {
                debugLog.push(`  ${i}: ❌ Failed to parse line: ${line.substring(0, 50)}...`);
                return null;
              }
            }).filter(Boolean);
            
            // Convert JSONL to transcript format for database save
            const allMessages = lines.map(line => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return null;
              }
            }).filter(Boolean);
            
            const transcript = { messages: allMessages };
            await saveToDatabase(transcript, session_id, cwd, debugLog);
          }
        } catch (parseError) {
          debugLog.push(`❌ Failed to parse transcript JSONL: ${parseError.message}`);
        }
      } else {
        debugLog.push(`❌ Transcript file does not exist`);
        
        // Check directory
        const dir = path.dirname(transcript_path);
        debugLog.push(`📁 Checking directory: ${dir}`);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          debugLog.push(`📁 Directory contains ${files.length} files:`);
          files.slice(0, 5).forEach(file => {
            debugLog.push(`  - ${file}`);
          });
        } else {
          debugLog.push(`❌ Directory does not exist`);
        }
      }
    }
    
    // Write debug log
    const logPath = path.join(__dirname, 'claude-hook-debug.log');
    fs.writeFileSync(logPath, debugLog.join('\n') + '\n', { flag: 'a' });
    
    console.error('🔧 Debug info written to claude-hook-debug.log');
    
  } catch (error) {
    debugLog.push(`❌ Error in debug hook: ${error.message}`);
    debugLog.push(`❌ Stack: ${error.stack}`);
    
    const logPath = path.join(__dirname, 'claude-hook-debug.log');
    fs.writeFileSync(logPath, debugLog.join('\n') + '\n', { flag: 'a' });
    
    console.error('❌ Error in Claude debug hook:', error);
  } finally {
    await pool.end();
  }
}

async function saveToDatabase(transcript, session_id, cwd, debugLog) {
  try {
    // Get the last user message and agent response
    const messages = transcript.messages || [];
    if (messages.length < 2) {
      debugLog.push('❌ Not enough messages in transcript for database save');
      return;
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
      debugLog.push('❌ Could not find user/assistant message pair for database');
      return;
    }
    
    debugLog.push(`💾 Saving to database: user=${user_message.substring(0, 50)}..., agent=${agent_response.substring(0, 50)}...`);

    // Get client_id for Claude Code (client 6)
    const clientId = 6;
    
    // Create or get Claude session meeting
    let meeting = await pool.query(
      'SELECT meeting_id FROM meetings.meetings WHERE name = $1 AND meeting_type = $2 AND client_id = $3',
      [`Claude Session ${session_id}`, 'claude_conversation', clientId]
    );

    let meetingId;
    if (meeting.rows.length === 0) {
      // Create new meeting for this Claude session
      const newMeeting = await pool.query(`
        INSERT INTO meetings.meetings (meeting_id, name, description, meeting_type, client_id, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING meeting_id
      `, [
        uuidv4(),
        `Claude Session ${session_id}`,
        `Claude Code conversation session started at ${new Date().toISOString()}`,
        'claude_conversation',
        clientId,
        JSON.stringify({ session_id, cwd, start_time: new Date().toISOString() })
      ]);
      meetingId = newMeeting.rows[0].meeting_id;
      debugLog.push(`✅ Created new Claude session meeting: ${meetingId}`);
    } else {
      meetingId = meeting.rows[0].meeting_id;
      debugLog.push(`✅ Using existing Claude session meeting: ${meetingId}`);
    }

    // Create turns for user prompt and Claude response
    const userTurnId = uuidv4();
    const claudeTurnId = uuidv4();
    
    // Insert user turn
    await pool.query(`
      INSERT INTO meetings.turns (turn_id, content, source_type, metadata, timestamp, meeting_id, client_id, created_at)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6, NOW())
    `, [userTurnId, user_message, 'user_input', JSON.stringify({ session_id, cwd }), meetingId, clientId]);

    // Insert Claude turn with slightly later timestamp to ensure ordering
    await pool.query(`
      INSERT INTO meetings.turns (turn_id, content, source_type, metadata, timestamp, meeting_id, client_id, created_at)
      VALUES ($1, $2, $3, $4, NOW() + interval '1 millisecond', $5, $6, NOW())
    `, [claudeTurnId, agent_response, 'claude_response', JSON.stringify({ session_id }), meetingId, clientId]);

    debugLog.push(`✅ Captured prompt/response pair for session ${session_id}`);
    
    // Extract TOC fragments from the turns
    try {
      debugLog.push(`🔍 Starting fragment extraction for turns...`);
      const fragmentAgent = new FragmentExtractionAgent(process.env.DATABASE_URL);
      
      // Process user turn for fragments
      const userFragmentResult = await fragmentAgent.processTurn(
        clientId,
        session_id,
        userTurnId,
        user_message
      );
      
      if (userFragmentResult.success) {
        debugLog.push(`✅ Extracted ${userFragmentResult.fragmentCount} fragments from user turn`);
      } else {
        debugLog.push(`⚠️ Fragment extraction failed for user turn: ${userFragmentResult.error}`);
      }
      
      // Process Claude response for fragments
      const claudeFragmentResult = await fragmentAgent.processTurn(
        clientId,
        session_id,
        claudeTurnId,
        agent_response
      );
      
      if (claudeFragmentResult.success) {
        debugLog.push(`✅ Extracted ${claudeFragmentResult.fragmentCount} fragments from Claude response`);
      } else {
        debugLog.push(`⚠️ Fragment extraction failed for Claude response: ${claudeFragmentResult.error}`);
      }
      
      // Close fragment agent connection
      await fragmentAgent.close();
      
      debugLog.push(`🎯 Fragment extraction complete`);
      
    } catch (fragmentError) {
      debugLog.push(`❌ Fragment extraction error: ${fragmentError.message}`);
      debugLog.push(`❌ Stack: ${fragmentError.stack}`);
    }
    
  } catch (dbError) {
    debugLog.push(`❌ Database error: ${dbError.message}`);
  }
}

// Run the hook
capturePromptResponse();