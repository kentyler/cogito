/**
 * Turn processor with embedding generation
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
   * Supports mini-horde inheritance: searches own client + parent client data
   * @param {string} turnId - Turn ID to find similar turns for
   * @param {number} limit - Maximum number of similar turns to return
   * @param {number} minSimilarity - Minimum similarity score (0-1)
   * @param {number|null} parentClientId - Parent client ID for mini-horde inheritance
   * @returns {Promise<array>} - Similar turns with similarity scores
   */
  async findSimilarTurns(turnId, limit = 10, minSimilarity = 0.7, parentClientId = null) {
    await this._ensureConnection();
    // Note: parentClientId support would need to be added to TurnOperationsExtended.findSimilarTurns
    // For now, use the existing method
    return await this.dbAgent.turns.findSimilarTurns(turnId, limit, minSimilarity);
  }

  /**
   * Search turns by semantic similarity to a query
   * @param {string} queryText - Text to search for
   * @param {number} limit - Maximum results
   * @param {number} minSimilarity - Minimum similarity score
   * @returns {Promise<array>} - Matching turns with similarity scores
   */
  async searchTurns(queryText, limit = 20, minSimilarity = 0.5) {
    await this._ensureConnection();
    
    // Generate embedding for the query
    const queryEmbedding = await this.embeddingService.generateEmbedding(queryText);
    const embeddingString = this.embeddingService.formatForDatabase(queryEmbedding);
    
    return await this.dbAgent.turns.searchBySimilarity(embeddingString, limit, minSimilarity);
  }

  /**
   * Get embedding statistics for analysis
   */
  async getEmbeddingStats() {
    await this._ensureConnection();
    return await this.dbAgent.turns.getEmbeddingStats();
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