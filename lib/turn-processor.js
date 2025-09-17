/**
 * Main Turn Processor - Unified turn processing pipeline
 * 
 * Orchestrates all turn processing steps:
 * 1. Addressing parsing (@mentions, /citations)
 * 2. Context retrieval (similar turns + file chunks)
 * 3. Index calculation (for insertable ordering)
 * 4. Content validation and embedding generation
 * 5. Database storage
 * 6. Notification handling
 * 
 * Replaces scattered turn processing logic with unified modular approach
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { EmbeddingService } from '#database/embedding-service.js';
import { TurnAddressingProcessor } from './turn-process-addressing.js';
import { TurnContextProcessor } from './turn-process-context.js';
import { TurnIndexingProcessor } from './turn-process-indexing.js';
import { TurnNotificationsProcessor } from './turn-process-notifications.js';

export class TurnProcessor {
  constructor(options = {}) {
    // Core services
    this.dbAgent = options.dbAgent || new DatabaseAgent();
    this.embeddingService = options.embeddingService || new EmbeddingService();
    this.generateEmbeddings = options.generateEmbeddings !== false;

    // Initialize processors
    this.addressingProcessor = new TurnAddressingProcessor(this.dbAgent);
    this.contextProcessor = new TurnContextProcessor(this.dbAgent, this.embeddingService, options);
    this.indexingProcessor = new TurnIndexingProcessor(this.dbAgent);
    this.notificationsProcessor = new TurnNotificationsProcessor(this.dbAgent);
  }

  async _ensureConnection() {
    if (!this.dbAgent.connector.pool) {
      await this.dbAgent.connect();
    }
  }

  /**
   * Main turn processing pipeline
   * @param {Object} turnData - Complete turn data
   * @returns {Promise<Object>} Created turn with all metadata and context
   */
  async createTurn(turnData) {
    const startTime = Date.now();
    
    try {
      await this._ensureConnection();

      // Validate required fields
      this._validateTurnData(turnData);

      // Step 1: Parse addressing (@mentions, /citations)
      const addressing = this.addressingProcessor.parseAddressing(turnData.content);

      // Step 2: Retrieve relevant context (turns + file chunks)
      const context = await this.contextProcessor.retrieveRelevantContext(turnData);

      // Step 3: Calculate turn index (for insertion)
      const turnIndex = await this.indexingProcessor.calculateTurnIndex(turnData);

      // Step 4: Validate and sanitize content
      const processedContent = this._validateContent(turnData.content);

      // Step 5: Prepare turn data (without embedding - we'll handle that separately)
      const finalTurnData = {
        ...turnData,
        content: processedContent,
        turn_index: turnIndex,
        content_embedding: null, // No longer store in turn record
        directed_to: [], // Could be populated from addressing
        metadata: {
          ...turnData.metadata,
          addressing: addressing.metadata,
          context: {
            turns_found: context.turns.length,
            chunks_found: context.chunks.length,
            total_context_items: context.total_context_items
          },
          processing: {
            processed_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime
          }
        }
      };

      // Step 6: Store turn in database first
      const createdTurn = await this.dbAgent.turns.createTurn(finalTurnData);

      // Step 7: Generate and store embeddings in unified table
      const embeddingMetadata = await this._generateAndStoreEmbeddings(createdTurn.id, processedContent, turnData.client_id);

      // Step 8: Handle notifications (for @mentions)
      const notificationIds = await this.notificationsProcessor.createNotifications(
        createdTurn, 
        addressing.mentions, 
        turnData.client_id
      );

      // Step 9: Log successful turn creation
      await this.dbAgent.logEvent('turn_created', {
        turn_id: createdTurn.id,
        client_id: turnData.client_id,
        user_id: turnData.user_id,
        content_length: processedContent.length,
        has_mentions: addressing.mentions.length > 0,
        has_citations: addressing.citations.length > 0,
        should_invoke_cogito: addressing.shouldInvokeCogito,
        context_items: context.total_context_items,
        notifications_created: notificationIds.length,
        processing_time_ms: Date.now() - startTime
      }, {
        component: 'TurnProcessor',
        severity: 'info'
      });

      // Step 9: Return complete turn with context and processing metadata
      return {
        ...createdTurn,
        addressing,
        context,
        embedding: embeddingMetadata,
        notifications: notificationIds,
        processing: {
          total_time_ms: Date.now() - startTime,
          steps_completed: 9
        }
      };
    } catch (error) {
      // Log turn creation failure
      await this.dbAgent.logError('turn_creation_failed', error, {
        component: 'TurnProcessor',
        client_id: turnData?.client_id,
        user_id: turnData?.user_id,
        content_length: turnData?.content?.length || 0,
        processing_time_ms: Date.now() - startTime,
        severity: 'error'
      });

      throw error;
    }
  }

  /**
   * Validate turn data has required fields
   * @private
   */
  _validateTurnData(turnData) {
    const required = ['content', 'client_id', 'source_type'];
    const missing = required.filter(field => !turnData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required turn data fields: ${missing.join(', ')}`);
    }

    if (typeof turnData.content !== 'string') {
      throw new Error('Turn content must be a string');
    }
  }

  /**
   * Validate and sanitize content
   * @private
   */
  _validateContent(content) {
    const trimmed = content.trim();
    
    if (trimmed.length === 0) {
      throw new Error('Content cannot be empty');
    }

    // Could add more sanitization:
    // - XSS prevention
    // - Length limits  
    // - Content filtering

    return trimmed;
  }

  /**
   * Generate embedding for content
   * @private
   */
  async _generateEmbedding(content) {
    if (!this.generateEmbeddings || !content || content.trim().length === 0) {
      return {
        vector: null,
        metadata: { 
          has_embedding: false, 
          reason: 'embeddings_disabled_or_empty_content' 
        }
      };
    }

    try {
      const embeddingVector = await this.embeddingService.generateEmbedding(content);
      const formattedVector = this.embeddingService.formatForDatabase(embeddingVector);

      return {
        vector: formattedVector,
        metadata: {
          has_embedding: true,
          model: this.embeddingService.getModelInfo().model,
          generated_at: new Date().toISOString(),
          content_length: content.length
        }
      };
    } catch (error) {
      await this.dbAgent.logError('turn_embedding_generation_failed', error, {
        component: 'TurnProcessor',
        content_length: content.length,
        severity: 'warning'
      });

      return {
        vector: null,
        metadata: {
          has_embedding: false,
          error: error.message,
          attempted_at: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Generate embeddings and store in unified turn_embeddings table
   * Handles chunking for long content
   * @private
   */
  async _generateAndStoreEmbeddings(turnId, content, clientId) {
    if (!this.generateEmbeddings || !content || content.trim().length === 0) {
      return {
        has_embedding: false,
        reason: 'embeddings_disabled_or_empty_content'
      };
    }

    const maxChunkSize = 2000; // Optimal size for embeddings
    const chunks = this._chunkContent(content, maxChunkSize);
    const embeddingResults = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkIndex = i; // 0 for whole content, 1+ for chunks
        
        // Generate embedding for this chunk
        const embeddingVector = await this.embeddingService.generateEmbedding(chunk);
        const formattedVector = this.embeddingService.formatForDatabase(embeddingVector);

        // Store in turn_embeddings table
        const insertQuery = `
          INSERT INTO meetings.turn_embeddings (
            turn_id, content_text, embedding_vector, chunk_index, chunk_size, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;

        const result = await this.dbAgent.connector.query(insertQuery, [
          turnId,
          chunk,
          formattedVector,
          chunkIndex,
          chunk.length,
          JSON.stringify({
            model: this.embeddingService.getModelInfo().model,
            generated_at: new Date().toISOString(),
            client_id: clientId
          })
        ]);

        embeddingResults.push({
          embedding_id: result.rows[0].id,
          chunk_index: chunkIndex,
          chunk_size: chunk.length
        });
      }

      return {
        has_embedding: true,
        chunks_created: embeddingResults.length,
        total_characters: content.length,
        model: this.embeddingService.getModelInfo().model,
        generated_at: new Date().toISOString(),
        embeddings: embeddingResults
      };

    } catch (error) {
      await this.dbAgent.logError('turn_embedding_storage_failed', error, {
        component: 'TurnProcessor',
        turn_id: turnId,
        client_id: clientId,
        content_length: content.length,
        chunks_attempted: chunks.length,
        severity: 'warning'
      });

      return {
        has_embedding: false,
        error: error.message,
        attempted_at: new Date().toISOString()
      };
    }
  }

  /**
   * Chunk content for embedding generation
   * @private
   */
  _chunkContent(content, maxSize = 2000) {
    if (content.length <= maxSize) {
      return [content]; // Return whole content as single chunk
    }

    const chunks = [];
    const lines = content.split('\n');
    let currentChunk = '';

    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // Removed explicit similarity search methods - users can ask LLM naturally instead

  /**
   * Get context for LLM - formatted for prompt inclusion
   */
  async getContextForLLM(turnId) {
    const turn = await this.dbAgent.turns.getTurnById(turnId);
    if (!turn?.metadata?.context) {
      return { context_summary: 'No context available', items: [] };
    }

    return this.contextProcessor.formatContextForLLM(turn.metadata.context);
  }
}

/**
 * Factory function for creating turn processor instances
 */
export async function createTurnProcessor(options = {}) {
  if (!options.dbAgent) {
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    options.dbAgent = dbAgent;
  }

  return new TurnProcessor(options);
}