/**
 * Turn Context Processor - Retrieve relevant context for LLM
 * 
 * Searches for similar content in:
 * - Previous conversation turns (via embeddings)
 * - Uploaded file chunks (via embeddings)
 * 
 * Provides context to LLM before generating responses
 */

import { findSimilarChunks } from '#server/conversations/conversation-context/chunk-finder.js';

export class TurnContextProcessor {
  constructor(dbAgent, embeddingService, options = {}) {
    this.dbAgent = dbAgent;
    this.embeddingService = embeddingService;
    
    // Configurable limits
    this.maxContextTurns = options.maxContextTurns || 10;
    this.maxContextChunks = options.maxContextChunks || 5;
    this.contextSimilarityThreshold = options.contextSimilarityThreshold || 0.6;
  }

  /**
   * Retrieve relevant context from past turns and file chunks
   * @param {Object} turnData - Turn data containing content and client_id
   * @returns {Promise<Object>} Context with turns and chunks
   */
  async retrieveRelevantContext(turnData) {
    const { content, client_id } = turnData;
    
    if (!content || !client_id || content.trim().length === 0) {
      return { turns: [], chunks: [], total_context_items: 0 };
    }

    try {
      // Search unified embeddings table for all content
      const allSimilarContent = await this._findSimilarContentUnified(content, client_id);

      // Separate into turns and file chunks for backward compatibility
      const turns = allSimilarContent.filter(item => item.source_type !== 'file_upload');
      const chunks = allSimilarContent.filter(item => item.source_type === 'file_upload');

      const contextResult = {
        turns: turns,
        chunks: chunks,
        total_context_items: allSimilarContent.length,
        unified_search: true // Indicates we used the new unified approach
      };

      // Log context retrieval success
      if (contextResult.total_context_items > 0) {
        await this.dbAgent.logEvent('turn_context_retrieved', {
          turns_found: contextResult.turns.length,
          chunks_found: contextResult.chunks.length,
          total_items: contextResult.total_context_items,
          client_id,
          content_length: content.length
        }, {
          component: 'TurnContextProcessor',
          severity: 'info'
        });
      }

      return contextResult;
    } catch (error) {
      // Log context retrieval failure
      await this.dbAgent.logError('turn_context_retrieval_failed', error, {
        component: 'TurnContextProcessor',
        client_id,
        content_length: content?.length || 0,
        severity: 'error'
      });

      // Return empty context on failure
      return { turns: [], chunks: [], total_context_items: 0 };
    }
  }

  /**
   * Find similar content using unified embeddings table
   * @private
   */
  async _findSimilarContentUnified(content, clientId) {
    try {
      // Generate embedding for search
      const queryEmbedding = await this.embeddingService.generateEmbedding(content);
      const embeddingString = this.embeddingService.formatForDatabase(queryEmbedding);

      // Search unified embeddings table
      const query = `
        SELECT 
          t.id as turn_id,
          t.content as full_content,
          t.source_type,
          t.user_id,
          t.created_at,
          t.turn_index,
          t.metadata,
          te.content_text,
          te.chunk_index,
          1 - (te.embedding_vector <=> $1::vector) as similarity
        FROM meetings.turn_embeddings te
        JOIN meetings.turns t ON te.turn_id = t.id
        WHERE t.client_id = $2
          AND 1 - (te.embedding_vector <=> $1::vector) >= $3
        ORDER BY similarity DESC
        LIMIT $4
      `;

      const result = await this.dbAgent.connector.query(query, [
        embeddingString,
        clientId,
        this.contextSimilarityThreshold,
        Math.max(this.maxContextTurns, this.maxContextChunks) // Use higher limit for unified search
      ]);

      return result.rows.map(row => ({
        id: row.turn_id,
        content: row.source_type === 'file_upload' ? row.content_text : row.full_content, // Use chunk for files, full content for turns
        source_type: row.source_type,
        user_id: row.user_id,
        created_at: row.created_at,
        turn_index: row.turn_index,
        metadata: row.metadata,
        chunk_index: row.chunk_index,
        similarity: parseFloat(row.similarity),
        context_type: row.source_type === 'file_upload' ? 'file_content' : 'conversation_turn'
      }));
    } catch (error) {
      // Log unified search error
      await this.dbAgent.logError('turn_context_unified_search_failed', error, {
        component: 'TurnContextProcessor',
        client_id: clientId,
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Find similar conversation turns using embeddings (LEGACY - kept for fallback)
   * @private
   */
  async _findSimilarConversationTurns(content, clientId) {
    try {
      // Generate embedding for search
      const queryEmbedding = await this.embeddingService.generateEmbedding(content);
      const embeddingString = this.embeddingService.formatForDatabase(queryEmbedding);

      // Search for similar turns in this client's conversations
      const query = `
        SELECT 
          t.id,
          t.content,
          t.source_type,
          t.user_id,
          t.created_at,
          t.turn_index,
          1 - (t.content_embedding <=> $1::vector) as similarity
        FROM meetings.turns t
        WHERE t.client_id = $2
          AND t.content_embedding IS NOT NULL
          AND t.content IS NOT NULL
          AND 1 - (t.content_embedding <=> $1::vector) >= $3
        ORDER BY similarity DESC
        LIMIT $4
      `;

      const result = await this.dbAgent.connector.query(query, [
        embeddingString,
        clientId,
        this.contextSimilarityThreshold,
        this.maxContextTurns
      ]);

      return result.rows.map(row => ({
        ...row,
        context_type: 'conversation_turn',
        similarity: parseFloat(row.similarity)
      }));
    } catch (error) {
      // Log specific error for conversation turns
      await this.dbAgent.logError('turn_context_conversation_search_failed', error, {
        component: 'TurnContextProcessor',
        client_id: clientId,
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Find similar file chunks using existing chunk finder
   * @private
   */
  async _findSimilarFileChunks(content, clientId) {
    try {
      const chunks = await findSimilarChunks({
        pool: null, // Will use DatabaseAgent internally
        embeddingService: this.embeddingService,
        content,
        clientId,
        limit: this.maxContextChunks,
        minSimilarity: this.contextSimilarityThreshold,
        parentClientId: null // Could support mini-horde later
      });

      return chunks.map(chunk => ({
        ...chunk,
        context_type: 'file_chunk'
      }));
    } catch (error) {
      // Log specific error for file chunks
      await this.dbAgent.logError('turn_context_file_search_failed', error, {
        component: 'TurnContextProcessor',
        client_id: clientId,
        severity: 'warning'
      });
      return [];
    }
  }

  /**
   * Format context for LLM consumption
   * @param {Object} context - Context with turns and chunks
   * @returns {Object} Formatted context for LLM
   */
  formatContextForLLM(context) {
    if (!context || context.total_context_items === 0) {
      return {
        context_summary: 'No relevant context found',
        items: []
      };
    }

    const formattedItems = [];

    // Add conversation context
    if (context.turns) {
      context.turns.forEach((turn) => {
        formattedItems.push({
          type: 'conversation',
          content: turn.content,
          similarity: turn.similarity,
          created_at: turn.created_at,
          source: `Previous conversation (${(turn.similarity * 100).toFixed(1)}% similar)`
        });
      });
    }

    // Add file context
    if (context.chunks) {
      context.chunks.forEach((chunk) => {
        formattedItems.push({
          type: 'file',
          content: chunk.content,
          similarity: chunk.similarity,
          filename: chunk.filename,
          source: `File: ${chunk.filename} (${(chunk.similarity * 100).toFixed(1)}% similar)`
        });
      });
    }

    // Sort by similarity descending
    formattedItems.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    return {
      context_summary: `Found ${context.turns?.length || 0} relevant conversations and ${context.chunks?.length || 0} relevant file sections`,
      total_items: formattedItems.length,
      items: formattedItems.slice(0, 15) // Limit for LLM context window
    };
  }

  /**
   * Validate context retrieval configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfiguration() {
    const issues = [];

    if (!this.embeddingService) {
      issues.push('Missing embedding service');
    }

    if (!this.dbAgent) {
      issues.push('Missing database agent');
    }

    if (this.maxContextTurns < 1 || this.maxContextTurns > 50) {
      issues.push('maxContextTurns should be between 1-50');
    }

    if (this.maxContextChunks < 1 || this.maxContextChunks > 20) {
      issues.push('maxContextChunks should be between 1-20');
    }

    if (this.contextSimilarityThreshold < 0 || this.contextSimilarityThreshold > 1) {
      issues.push('contextSimilarityThreshold should be between 0-1');
    }

    if (issues.length > 0) {
      console.error('TurnContextProcessor configuration issues:', issues);
      return false;
    }

    return true;
  }
}