#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { StopHookProcessor } from './lib/hook-processors/stop-hook-processor.js';

// Load environment from the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function capturePromptResponse() {
  let processor;
  
  try {
    // Read hook data from stdin
    const hookDataRaw = fs.readFileSync(0, 'utf8');
    const hookData = JSON.parse(hookDataRaw);
    const { session_id, transcript_path, hook_event_name, cwd } = hookData;
    
    // Initialize processor
    processor = new StopHookProcessor(process.env.DATABASE_URL);
    
    // Log hook event
    console.log(`📋 ${hook_event_name} hook triggered for session: ${session_id}`);
    
    // Validate required data
    if (!transcript_path || !fs.existsSync(transcript_path)) {
      console.log(`⚠️ Transcript file not found: ${transcript_path || 'undefined'}`);
      return;
    }
    
    // Read transcript content
    const transcriptContent = fs.readFileSync(transcript_path, 'utf-8').trim();
    if (!transcriptContent) {
      console.log(`⚠️ Empty transcript file: ${transcript_path}`);
      return;
    }
    
    // Parse conversation turns from transcript
    const turns = parseConversationTurns(transcriptContent);
    if (turns.length === 0) {
      console.log(`⚠️ No conversation turns found in transcript`);
      return;
    }
    
    // Default client ID (Cogito internal)
    const clientId = 6;
    
    // Create session if needed
    await processor.createSessionIfNeeded(session_id, clientId);
    
    // Process each conversation exchange
    for (let i = 0; i < turns.length; i += 2) {
      const userTurn = turns[i];
      const claudeTurn = turns[i + 1];
      
      if (userTurn && claudeTurn) {
        await processor.processSessionTurns(
          session_id,
          clientId,
          userTurn.content,
          claudeTurn.content
        );
      }
    }
    
    // Get and display debug log
    const debugLog = processor.getDebugLog();
    debugLog.forEach(entry => console.log(entry));
    
    console.log(`✅ Hook processing completed for session: ${session_id}`);
    
  } catch (error) {
    console.error(`❌ Hook processing error:`, error);
    
    // Write debug information to file
    const debugData = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      hookData: hookData || 'Failed to parse'
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'claude-hook-debug.log'),
      JSON.stringify(debugData, null, 2) + '\n',
      { flag: 'a' }
    );
    
  } finally {
    if (processor) {
      await processor.close();
    }
  }
}

function parseConversationTurns(transcript) {
  const turns = [];
  const lines = transcript.split('\n').filter(line => line.trim());
  
  let currentTurn = null;
  let currentContent = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('Human: ') || trimmedLine.startsWith('Assistant: ')) {
      // Save previous turn
      if (currentTurn && currentContent.length > 0) {
        turns.push({
          speaker: currentTurn,
          content: currentContent.join('\n').trim()
        });
      }
      
      // Start new turn
      currentTurn = trimmedLine.startsWith('Human: ') ? 'user' : 'assistant';
      currentContent = [trimmedLine.substring(trimmedLine.indexOf(': ') + 2)];
    } else if (currentTurn && trimmedLine) {
      currentContent.push(trimmedLine);
    }
  }
  
  // Save final turn
  if (currentTurn && currentContent.length > 0) {
    turns.push({
      speaker: currentTurn,
      content: currentContent.join('\n').trim()
    });
  }
  
  return turns;
}

// Handle both direct execution and hook execution
if (process.stdin.isTTY) {
  console.log('Claude Stop Hook - Ready to process transcript data from stdin');
  process.exit(0);
} else {
  capturePromptResponse().catch(console.error);
}