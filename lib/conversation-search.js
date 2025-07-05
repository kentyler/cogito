/**
 * Conversation Search Service
 * Semantic search through conversation history using vector embeddings
 */

import { DatabaseManager } from './database.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class ConversationSearchService {
  constructor() {
    this.db = new DatabaseManager();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate embedding for search query
   */
  async generateQueryEmbedding(query) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query.trim(),
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw error;
    }
  }

  /**
   * Search conversations using vector similarity
   * @param {string} query - Natural language search query
   * @param {number} limit - Maximum number of results (default: 5)
   * @param {number} threshold - Similarity threshold 0-1 (default: 0.3)
   * @returns {Array} Array of matching conversation turns
   */
  async searchConversations(query, limit = 5, threshold = 0.3) {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Search using cosine similarity
      const searchQuery = `
        SELECT 
          ct.id,
          ct.content_text,
          ct.interaction_type,
          ct.session_id,
          ct.turn_index,
          ct.created_at,
          ct.llm_model,
          p.name as participant_name,
          proj.name as project_name,
          (1 - (t.metadata->>'content_vector'::vector <=> $1::vector)) as similarity_score
        FROM turns t
        LEFT JOIN participants p ON t.participant_id = p.id
        LEFT JOIN blocks b ON EXISTS (
          SELECT 1 FROM block_turns bt 
          WHERE bt.turn_id = t.turn_id AND bt.block_id = b.block_id
        )
        WHERE t.metadata->>'content_vector' IS NOT NULL
          AND (1 - (t.metadata->>'content_vector'::vector <=> $1::vector)) >= $2
        ORDER BY similarity_score DESC
        LIMIT $3
      `;
      
      const result = await this.db.pool.query(searchQuery, [
        JSON.stringify(queryEmbedding),
        threshold,
        limit
      ]);
      
      return result.rows.map(row => ({
        id: row.id,
        content: row.content_text,
        interactionType: row.interaction_type,
        sessionId: row.session_id,
        turnIndex: parseFloat(row.turn_index),
        participantName: row.participant_name,
        projectName: row.project_name,
        similarity: parseFloat(row.similarity_score),
        createdAt: row.created_at,
        llmModel: row.llm_model
      }));
      
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  /**
   * Search with context - includes surrounding turns
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @param {number} contextTurns - Number of turns before/after to include
   */
  async searchWithContext(query, limit = 3, contextTurns = 2) {
    const matches = await this.searchConversations(query, limit);
    
    const enrichedResults = [];
    
    for (const match of matches) {
      // Get surrounding context turns
      const contextQuery = `
        SELECT 
          t.turn_id as id,
          t.content as content_text,
          t.source_type as interaction_type,
          bt.sequence_order as turn_index,
          p.name as participant_name
        FROM turns t
        JOIN block_turns bt ON t.turn_id = bt.turn_id
        JOIN blocks b ON bt.block_id = b.block_id
        LEFT JOIN participants p ON t.participant_id = p.id
        WHERE b.metadata->>'session_id' = $1
          AND bt.sequence_order BETWEEN $2 AND $3
        ORDER BY bt.sequence_order ASC
      `;
      
      const contextResult = await this.db.pool.query(contextQuery, [
        match.sessionId,
        match.turnIndex - contextTurns,
        match.turnIndex + contextTurns
      ]);
      
      enrichedResults.push({
        ...match,
        context: contextResult.rows.map(row => ({
          id: row.id,
          content: row.content_text,
          interactionType: row.interaction_type,
          turnIndex: parseFloat(row.turn_index),
          participantName: row.participant_name,
          isMatch: row.id === match.id
        }))
      });
    }
    
    return enrichedResults;
  }

  /**
   * Format search results for display
   */
  formatResults(results) {
    return results.map(result => {
      const date = new Date(result.createdAt).toLocaleString();
      const similarity = (result.similarity * 100).toFixed(1);
      
      return `
📍 **Match** (${similarity}% similarity) - ${result.participantName} - ${date}
📁 Project: ${result.projectName || 'Unknown'} | Session: ${result.sessionId}
💬 ${result.content}
---`;
    }).join('\n');
  }

  /**
   * Format results with context for display
   */
  formatResultsWithContext(results) {
    return results.map(result => {
      const date = new Date(result.createdAt).toLocaleString();
      const similarity = (result.similarity * 100).toFixed(1);
      
      let output = `
📍 **Match** (${similarity}% similarity) - ${date}
📁 Project: ${result.projectName || 'Unknown'} | Session: ${result.sessionId}

🔍 **Context:**`;
      
      result.context.forEach(turn => {
        const indicator = turn.isMatch ? '🎯' : '💭';
        const emphasis = turn.isMatch ? '**' : '';
        output += `\n${indicator} ${turn.participantName}: ${emphasis}${turn.content}${emphasis}`;
      });
      
      return output + '\n---';
    }).join('\n');
  }
}

// Export singleton instance
export const conversationSearch = new ConversationSearchService();