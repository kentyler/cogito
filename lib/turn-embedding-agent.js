/**
 * Turn Embedding Agent
 * 
 * Takes speaker turns from the transcript buffer and:
 * 1. Generates embeddings using OpenAI
 * 2. Stores in conversation.turns table with proper metadata
 * 3. Handles retries and error cases
 * 4. Maintains async processing while preserving order via block_index
 */

import { EmbeddingService } from './embedding-service.js';
import { DatabaseAgent } from './database-agent.js';

export class TurnEmbeddingAgent {
  constructor(options = {}) {
    this.embeddingService = options.embeddingService || new EmbeddingService();
    this.databaseAgent = options.databaseAgent || new DatabaseAgent();
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Process a turn: generate embedding and store in database
   * @param {Object} turn - Turn data from transcript buffer
   */
  async processTurn(turn) {
    const startTime = Date.now();
    
    try {
      console.log(`[TurnEmbedding] Processing turn ${turn.blockIndex} for ${turn.speaker}`);
      
      // Generate embedding with retry logic
      const embedding = await this.generateEmbeddingWithRetry(turn.content);
      
      // Store in database
      const storedTurn = await this.storeTurn({
        ...turn,
        embedding
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`[TurnEmbedding] Completed turn ${turn.blockIndex} in ${processingTime}ms`);
      
      return storedTurn;
      
    } catch (error) {
      console.error(`[TurnEmbedding] Failed to process turn ${turn.blockIndex}:`, error);
      
      // Store without embedding rather than lose the turn entirely
      try {
        const storedTurn = await this.storeTurn({
          ...turn,
          embedding: null,
          metadata: {
            ...turn.metadata,
            embedding_error: error.message,
            embedding_failed_at: new Date().toISOString()
          }
        });
        
        console.log(`[TurnEmbedding] Stored turn ${turn.blockIndex} without embedding`);
        return storedTurn;
        
      } catch (storageError) {
        console.error(`[TurnEmbedding] Failed to store turn ${turn.blockIndex} even without embedding:`, storageError);
        throw storageError;
      }
    }
  }

  /**
   * Generate embedding with retry logic
   */
  async generateEmbeddingWithRetry(content, attempt = 1) {
    try {
      const embedding = await this.embeddingService.generateEmbedding(content);
      return this.embeddingService.formatForDatabase(embedding);
      
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`[TurnEmbedding] Retry attempt ${attempt} for embedding generation`);
        await this.delay(this.retryDelay * attempt);
        return this.generateEmbeddingWithRetry(content, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Store turn in database
   */
  async storeTurn(turn) {
    const query = `
      INSERT INTO conversation.turns (
        block_id,
        client_id,
        user_id,
        content,
        content_embedding,
        block_index,
        metadata,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING turn_id, created_at
    `;
    
    const values = [
      turn.blockId,
      turn.clientId,
      turn.user_id || null, // New user_id field
      turn.content,
      turn.embedding,
      turn.blockIndex,
      JSON.stringify(turn.metadata),
      turn.timestamp || new Date()
    ];
    
    try {
      const result = await this.databaseAgent.query(query, values);
      return {
        ...turn,
        turnId: result.rows[0].turn_id,
        storedAt: result.rows[0].created_at
      };
      
    } catch (error) {
      console.error('[TurnEmbedding] Database storage error:', error);
      throw new Error(`Failed to store turn: ${error.message}`);
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
   * Get processing statistics
   */
  async getProcessingStats(blockId) {
    const query = `
      SELECT 
        COUNT(*) as total_turns,
        COUNT(content_embedding) as turns_with_embeddings,
        COUNT(*) - COUNT(content_embedding) as turns_without_embeddings,
        AVG(LENGTH(content)) as avg_content_length,
        MIN(block_index) as first_turn_index,
        MAX(block_index) as last_turn_index
      FROM conversation.turns 
      WHERE block_id = $1
    `;
    
    const result = await this.databaseAgent.query(query, [blockId]);
    return result.rows[0];
  }

  /**
   * Utility: delay function for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check: verify embedding service is working
   */
  async healthCheck() {
    try {
      const testEmbedding = await this.embeddingService.generateEmbedding('test');
      return {
        status: 'healthy',
        embeddingDimensions: testEmbedding.length,
        model: this.embeddingService.getModelInfo()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

// Example usage:
/*
const embeddingAgent = new TurnEmbeddingAgent();

// Process a single turn
const turn = {
  blockId: 'abc-123',
  blockMeetingId: 456,
  clientId: 6,
  speaker: 'Ken',
  content: 'I think we should consider the authentication flow.',
  blockIndex: 1,
  metadata: { speaker_label: 'Ken' }
};

await embeddingAgent.processTurn(turn);
*/