/**
 * Turn Embedding Agent - Modular version
 * 
 * Takes speaker turns from the transcript buffer and:
 * 1. Generates embeddings using OpenAI
 * 2. Stores in turns table with proper metadata
 * 3. Handles retries and error cases
 * 4. Maintains async processing while preserving order via turn_index
 */

import { TurnStorage } from './turn-embedding-agent/turn-storage.js';
import { EmbeddingRetryHandler } from './turn-embedding-agent/embedding-retry-handler.js';

export class TurnEmbeddingAgent {
  constructor(options = {}) {
    this.storage = new TurnStorage(options);
    this.embeddingHandler = new EmbeddingRetryHandler(options);
  }

  /**
   * Process a turn: generate embedding and store in database
   * @param {Object} turn - Turn data from transcript buffer
   */
  async processTurn(turn) {
    const startTime = Date.now();
    
    try {
      console.log(`[TurnEmbedding] Processing turn ${turn.meetingIndex} for ${turn.speaker}`);
      
      // Generate embedding with retry logic
      const embedding = await this.embeddingHandler.generateEmbeddingWithRetry(turn.content);
      
      // Store in database
      const storedTurn = await this.storage.storeTurn({
        ...turn,
        embedding
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`[TurnEmbedding] Completed turn ${turn.meetingIndex} in ${processingTime}ms`);
      
      return storedTurn;
      
    } catch (error) {
      console.error(`[TurnEmbedding] Failed to process turn ${turn.meetingIndex}:`, error);
      
      // Store without embedding rather than lose the turn entirely
      try {
        const storedTurn = await this.storage.storeTurn({
          ...turn,
          embedding: null,
          metadata: {
            ...turn.metadata,
            embedding_error: error.message,
            embedding_failed_at: new Date().toISOString()
          }
        });
        
        console.log(`[TurnEmbedding] Stored turn ${turn.meetingIndex} without embedding`);
        return storedTurn;
        
      } catch (storageError) {
        console.error(`[TurnEmbedding] Failed to store turn ${turn.meetingIndex} even without embedding:`, storageError);
        throw storageError;
      }
    }
  }

  /**
   * Process multiple turns in parallel (with concurrency limit)
   */
  async processTurns(turns, concurrency = 3) {
    const results = [];
    
    for (let i = 0; i < turns.length; i += concurrency) {
      const batch = turns.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(turn => this.processTurn(turn))
      );
      
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Get processing statistics for a meeting
   */
  async getProcessingStats(meetingId) {
    return await this.storage.getProcessingStats(meetingId);
  }

  /**
   * Health check for the embedding agent
   */
  async healthCheck() {
    return await this.embeddingHandler.healthCheck();
  }
}