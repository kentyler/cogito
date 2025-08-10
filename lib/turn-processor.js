/**
 * Turn processor with embedding generation
 * ES Module that can be imported into the conversational REPL
 */

import { EmbeddingService } from './embedding-service.js';
import { DatabaseAgent } from './database-agent.js';
import { v4 as uuidv4 } from 'uuid';

export class TurnProcessor {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.dbAgent = options.dbAgent || new DatabaseAgent();
    this.embeddingService = options.embeddingService || new EmbeddingService();
    this.generateEmbeddings = options.generateEmbeddings !== false; // Default true
  }

  async _ensureConnection() {
    if (!this.dbAgent.connector.pool) {
      await this.dbAgent.connect();
    }
  }

  /**
   * Process a new turn with optional embedding generation
   * @param {object} turnData - Turn data to insert
   * @returns {Promise<object>} - Created turn with embedding info
   */
  async createTurn(turnData) {
    await this._ensureConnection();
    
    const { participant_id, user_id, content, source_type, source_id, metadata = {}, meeting_id } = turnData;
    // Use user_id if provided, otherwise fall back to participant_id for backward compatibility
    const userId = user_id || participant_id;
    
    let embedding = null;
    let embeddingMetadata = {};
    
    // Generate embedding if content exists and embeddings are enabled
    if (this.generateEmbeddings && content && content.trim().length > 0) {
      try {
        const embeddingVector = await this.embeddingService.generateEmbedding(content);
        embedding = this.embeddingService.formatForDatabase(embeddingVector);
        embeddingMetadata = {
          has_embedding: true,
          embedding_model: this.embeddingService.getModelInfo().model,
          embedding_generated_at: new Date().toISOString()
        };
      } catch (error) {
        console.error('Failed to generate embedding:', error.message);
        embeddingMetadata = {
          has_embedding: false,
          embedding_error: error.message
        };
      }
    }
    
    // Merge embedding metadata with provided metadata
    const finalMetadata = { ...metadata, ...embeddingMetadata };
    
    // Prepare turn data for domain operation
    const turnCreateData = {
      user_id: userId,
      content,
      source_type,
      source_id,
      metadata: finalMetadata,
      content_embedding: embedding,
      meeting_id
    };
    
    // Use DatabaseAgent turns domain to create the turn
    const createdTurn = await this.dbAgent.turns.createTurn(turnCreateData);
    
    return createdTurn;
  }

  /**
   * Find similar turns using embedding similarity
   * @param {string} turnId - Turn ID to find similar turns for
   * @param {number} limit - Maximum number of similar turns to return
   * @param {number} minSimilarity - Minimum similarity score (0-1)
   * @returns {Promise<array>} - Similar turns with similarity scores
   */
  async findSimilarTurns(turnId, limit = 10, minSimilarity = 0.7) {
    const query = `
      WITH target_turn AS (
        SELECT content_embedding, meeting_id
        FROM meetings.turns
        WHERE id = $1
        AND content_embedding IS NOT NULL
      ),
      target_meeting AS (
        SELECT client_id
        FROM meetings.meetings m
        JOIN target_turn tt ON m.id = tt.meeting_id
      )
      SELECT 
        t.id,
        t.content,
        t.source_type,
        t.metadata,
        t.timestamp,
        t.client_id,
        m.client_id,
        -- Get the response if this turn has one
        resp.content as response_content,
        1 - (t.content_embedding <=> tt.content_embedding) as similarity
      FROM meetings.turns t
      CROSS JOIN target_turn tt
      JOIN meetings.meetings m ON t.meeting_id = m.id
      CROSS JOIN target_meeting tm
      LEFT JOIN meetings.turns resp ON resp.source_id = t.id AND resp.source_type LIKE '%llm%'
      WHERE t.id != $1
      AND t.content_embedding IS NOT NULL
      AND m.client_id = tm.client_id  -- Only get turns from same client
      AND 1 - (t.content_embedding <=> tt.content_embedding) >= $3
      ORDER BY similarity DESC
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [turnId, limit, minSimilarity]);
    return result.rows;
  }

  /**
   * Search turns by semantic similarity to a query
   * @param {string} queryText - Text to search for
   * @param {number} limit - Maximum results
   * @param {number} minSimilarity - Minimum similarity score
   * @returns {Promise<array>} - Matching turns with similarity scores
   */
  async searchTurns(queryText, limit = 20, minSimilarity = 0.5) {
    // Generate embedding for the query
    const queryEmbedding = await this.embeddingService.generateEmbedding(queryText);
    const embeddingString = this.embeddingService.formatForDatabase(queryEmbedding);
    
    const query = `
      SELECT 
        id,
        content,
        source_type,
        metadata,
        timestamp,
        1 - (content_embedding <=> $1::vector) as similarity
      FROM meetings.turns
      WHERE content_embedding IS NOT NULL
      AND 1 - (content_embedding <=> $1::vector) >= $3
      ORDER BY similarity DESC
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [embeddingString, limit, minSimilarity]);
    return result.rows;
  }

  /**
   * Get embedding statistics for analysis
   */
  async getEmbeddingStats() {
    const query = `
      SELECT 
        COUNT(*) as total_turns,
        COUNT(content) as turns_with_content,
        COUNT(content_embedding) as turns_with_embedding,
        COUNT(CASE WHEN content IS NOT NULL AND content_embedding IS NULL THEN 1 END) as turns_needing_embedding
      FROM meetings.turns
    `;
    
    const result = await this.pool.query(query);
    return result.rows[0];
  }
}

// Export a factory function for CommonJS compatibility
export async function createTurnProcessor(pool, options = {}) {
  // Create shared DatabaseAgent instance if not provided
  if (!options.dbAgent) {
    const { DatabaseAgent } = await import('./database-agent.js');
    options.dbAgent = new DatabaseAgent();
    await options.dbAgent.connect();
  }
  return new TurnProcessor(pool, options);
}