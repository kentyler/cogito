#!/usr/bin/env node

/**
 * Meeting Simulation Script
 * 
 * Simulates a meeting by processing the transcript file through our agent pipeline.
 * Creates a block record and processes transcript chunks to test the system.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TranscriptBufferAgent } from '../lib/transcript-buffer-agent.js';
import { TurnEmbeddingAgent } from '../lib/turn-embedding-agent.js';
import { SpeakerProfileAgent } from '../lib/speaker-profile-agent.js';
import { DatabaseAgent } from '../lib/database-agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MeetingSimulator {
  constructor() {
    this.databaseAgent = new DatabaseAgent();
    this.embeddingAgent = new TurnEmbeddingAgent();
    this.profileAgent = new SpeakerProfileAgent({
      meetingUrl: 'https://meet.google.com/test-meeting' // Test meeting URL
    });
    
    this.bufferAgent = new TranscriptBufferAgent({
      maxLength: 1000,
      onTurnReady: async (turn) => {
        console.log(`[Simulator] Processing turn ${turn.blockIndex} from ${turn.speaker}`);
        
        // Process speaker profile first
        const userId = await this.profileAgent.processSpeaker(turn.speaker, turn.blockId);
        
        // Add user_id to turn if speaker was identified
        if (userId) {
          turn.user_id = userId;
          console.log(`[Simulator] Identified speaker ${turn.speaker} as user_id: ${userId}`);
        }
        
        // Process turn with embedding
        await this.embeddingAgent.processTurn(turn);
      }
    });
  }

  /**
   * Create a block record for the meeting
   */
  async createBlock(clientId, userId) {
    // Generate a meeting ID by counting existing blocks for this client
    const countQuery = `SELECT COUNT(*) as count FROM conversation.blocks WHERE client_id = $1`;
    const countResult = await this.databaseAgent.query(countQuery, [clientId]);
    const meetingId = parseInt(countResult.rows[0].count) + 1;
    
    const query = `
      INSERT INTO conversation.blocks (
        name,
        description,
        block_type,
        metadata,
        client_id,
        created_by_user_id,
        created_at
      ) VALUES (
        $1,
        $2,
        'meeting',
        $3,
        $4,
        $5,
        NOW()
      )
      RETURNING block_id
    `;
    
    const metadata = {
      meeting_id: meetingId,
      simulation: true,
      transcript_source: 'meeting-47-full-transcript-formatted.txt'
    };
    
    const values = [
      `Meeting ${meetingId} Simulation`,
      `Simulated meeting from transcript for testing agent pipeline`,
      JSON.stringify(metadata),
      clientId,
      userId
    ];
    
    const result = await this.databaseAgent.query(query, values);
    return {
      block_id: result.rows[0].block_id,
      block_meeting_id: meetingId
    };
  }

  /**
   * Parse transcript file and extract speaker chunks
   */
  async parseTranscript(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const chunks = [];
    
    // Find the separator and extract transcript section
    const separatorIndex = content.indexOf('=====================================');
    if (separatorIndex === -1) {
      throw new Error('No transcript separator found');
    }
    
    const transcriptContent = content.substring(separatorIndex + 40); // Skip separator
    
    // Split the entire transcript on speaker brackets [Speaker Name]
    const segments = transcriptContent.split(/\[([^\]]+)\]/);
    
    let currentSpeaker = null;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();
      if (!segment) continue;
      
      if (i % 2 === 1) {
        // Odd indices are speaker names
        currentSpeaker = segment;
      } else if (i % 2 === 0 && currentSpeaker) {
        // Even indices are text content for the current speaker
        const text = segment.trim();
        if (text) {
          chunks.push({
            speaker: currentSpeaker,
            text: text,
            timestamp: new Date()
          });
        }
      }
    }
    
    // Also handle any speaker: format at the start
    const firstSegment = segments[0];
    const colonMatch = firstSegment.match(/^([^:]+):\s*(.+)/s);
    if (colonMatch) {
      chunks.unshift({
        speaker: colonMatch[1].trim(),
        text: colonMatch[2].trim(),
        timestamp: new Date()
      });
    }
    
    return chunks;
  }

  /**
   * Simulate the meeting by processing chunks with delays
   */
  async simulateMeeting(transcriptPath, clientId, userId) {
    console.log('🎬 Starting meeting simulation...');
    
    // Create block record
    console.log('📝 Creating block record...');
    const block = await this.createBlock(clientId, userId);
    console.log(`✅ Created block ${block.block_id} (meeting ${block.block_meeting_id})`);
    
    // Initialize buffer agent
    this.bufferAgent.startNewBlock({
      blockId: block.block_id,
      clientId: clientId
    });
    
    // Parse transcript
    console.log('📄 Parsing transcript...');
    const chunks = await this.parseTranscript(transcriptPath);
    console.log(`📊 Found ${chunks.length} speaker chunks`);
    
    // Process chunks with realistic delays
    console.log('🗣️  Processing transcript chunks...');
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[${i + 1}/${chunks.length}] ${chunk.speaker}: "${chunk.text.substring(0, 60)}..."`);
      
      try {
        await this.bufferAgent.addChunk(chunk);
        
        // Add realistic delay between chunks (0.5-2 seconds)
        const delay = Math.random() * 1500 + 500;
        await this.sleep(delay);
        
      } catch (error) {
        console.error(`❌ Error processing chunk ${i + 1}:`, error);
      }
    }
    
    // End the meeting
    console.log('🏁 Ending meeting...');
    const summary = await this.bufferAgent.endBlock();
    
    // Get final statistics
    const stats = await this.embeddingAgent.getProcessingStats(block.block_id);
    
    console.log('\n📊 Meeting Simulation Complete!');
    console.log(`Block ID: ${block.block_id}`);
    console.log(`Meeting ID: ${block.block_meeting_id}`);
    console.log(`Total Turns: ${stats.total_turns}`);
    console.log(`Turns with Embeddings: ${stats.turns_with_embeddings}`);
    console.log(`Turns without Embeddings: ${stats.turns_without_embeddings}`);
    console.log(`Average Content Length: ${Math.round(stats.avg_content_length)} chars`);
    
    // Show speaker profile statistics
    const profileStats = this.profileAgent.getStats();
    console.log('\n👥 Speaker Profile Statistics:');
    console.log(`Meeting Context: ${profileStats.context}`);
    console.log(`Cached Speakers: ${profileStats.cachedSpeakers}`);
    console.log(`Profiles Generated: ${profileStats.processedSpeakers}`);
    console.log(`Known Speakers: ${profileStats.knownSpeakers.join(', ')}`);
    
    return {
      blockId: block.block_id,
      meetingId: block.block_meeting_id,
      stats,
      profileStats
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    await this.databaseAgent.close();
  }
}

// Main execution
async function main() {
  const simulator = new MeetingSimulator();
  
  try {
    const transcriptPath = path.join(__dirname, '../conversational-repl/meeting-47-full-transcript-formatted.txt');
    const clientId = 8;
    const userId = 1;
    
    const result = await simulator.simulateMeeting(transcriptPath, clientId, userId);
    
    console.log('\n🎯 Simulation successful!');
    console.log('Use this block_id for testing queries:', result.blockId);
    
  } catch (error) {
    console.error('💥 Simulation failed:', error);
    process.exit(1);
  } finally {
    await simulator.cleanup();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { MeetingSimulator };