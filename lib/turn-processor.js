/**
 * Turn processor with embedding generation
 * ES Module that can be imported into the conversational REPL
 */

import { EmbeddingService } from './embedding-service.js';

export class TurnProcessor {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.embeddingService = options.embeddingService || new EmbeddingService();
    this.generateEmbeddings = options.generateEmbeddings !== false; // Default true
  }

  /**
   * Process a new turn with optional embedding generation
   * @param {object} turnData - Turn data to insert
   * @returns {Promise<object>} - Created turn with embedding info
   */
  async createTurn(turnData) {
    const { participant_id, content, source_type, source_turn_id, metadata = {} } = turnData;
    
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
    
    // Insert turn with embedding
    const query = `
      INSERT INTO conversation.turns (
        participant_id, 
        content, 
        source_type, 
        source_turn_id, 
        metadata,
        content_embedding
      ) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING turn_id, created_at, metadata
    `;
    
    const result = await this.pool.query(query, [
      participant_id,
      content,
      source_type,
      source_turn_id,
      finalMetadata,
      embedding
    ]);
    
    return result.rows[0];
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
        SELECT content_embedding
        FROM conversation.turns
        WHERE turn_id = $1
        AND content_embedding IS NOT NULL
      )
      SELECT 
        t.turn_id,
        t.content,
        t.source_type,
        t.metadata,
        t.timestamp,
        1 - (t.content_embedding <=> tt.content_embedding) as similarity
      FROM conversation.turns t, target_turn tt
      WHERE t.turn_id != $1
      AND t.content_embedding IS NOT NULL
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
        turn_id,
        content,
        source_type,
        metadata,
        timestamp,
        1 - (content_embedding <=> $1::vector) as similarity
      FROM conversation.turns
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
      FROM conversation.turns
    `;
    
    const result = await this.pool.query(query);
    return result.rows[0];
  }
}

// Export a factory function for CommonJS compatibility
export async function createTurnProcessor(pool, options) {
  return new TurnProcessor(pool, options);
}