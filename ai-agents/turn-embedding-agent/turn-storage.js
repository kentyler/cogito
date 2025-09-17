/**
 * Turn Storage - Handle database operations for turns
 */

import { DatabaseAgent } from '#database/database-agent.js';

export class TurnStorage {
  constructor(options = {}) {
    // Prefer database pool if provided, otherwise use DatabaseAgent
    this.pool = options.pool;
    this.databaseAgent = options.databaseAgent || new DatabaseAgent();
  }

  async _ensureConnection() {
    if (!this.databaseAgent.connector.pool) {
      await this.databaseAgent.connect();
    }
  }

  /**
   * Store turn in database using turns domain operations
   */
  async storeTurn(turn) {
    await this._ensureConnection();
    
    try {
      // Prepare turn data for domain operation
      const turnData = {
        meeting_id: turn.meetingId,
        client_id: turn.clientId,
        user_id: turn.user_id || null,
        content: turn.content,
        content_embedding: turn.embedding,
        turn_index: turn.turnIndex || turn.meetingIndex, // Support both old and new property names
        metadata: turn.metadata,
        timestamp: turn.timestamp || new Date().toISOString()
      };
      
      // Use DatabaseAgent turns domain to create the turn
      const createdTurn = await this.databaseAgent.turns.createTurn(turnData);
      
      return {
        ...turn,
        turnId: createdTurn.id,
        storedAt: createdTurn.created_at
      };
      
    } catch (error) {
      console.error('[TurnStorage] Database storage error:', error);
      throw new Error(`Failed to store turn: ${error.message}`);
    }
  }

  /**
   * Get processing statistics for a meeting
   */
  async getProcessingStats(meetingId) {
    const query = `
      SELECT 
        COUNT(*) as total_turns,
        COUNT(content_embedding) as turns_with_embeddings,
        COUNT(*) - COUNT(content_embedding) as turns_without_embeddings,
        AVG(LENGTH(content)) as avg_content_length,
        MIN(turn_index) as first_turn_index,
        MAX(turn_index) as last_turn_index
      FROM meetings.turns 
      WHERE meeting_id = $1
    `;
    
    // Use pool if available, otherwise fall back to databaseAgent
    const result = this.pool 
      ? await this.pool.query(query, [meetingId])
      : await this.databaseAgent.query(query, [meetingId]);
    
    return result.rows[0];
  }
}