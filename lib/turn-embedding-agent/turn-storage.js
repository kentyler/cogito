/**
 * Turn Storage - Handle database operations for turns
 */

import { DatabaseAgent } from '../database-agent.js';

export class TurnStorage {
  constructor(options = {}) {
    this.databaseAgent = options.databaseAgent || new DatabaseAgent();
  }

  /**
   * Store turn in database
   */
  async storeTurn(turn) {
    const query = `
      INSERT INTO meetings.turns (
        meeting_id,
        client_id,
        user_id,
        content,
        content_embedding,
        meeting_index,
        metadata,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING turn_id, created_at
    `;
    
    const values = [
      turn.meetingId,
      turn.clientId,
      turn.user_id || null,
      turn.content,
      turn.embedding,
      turn.meetingIndex,
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
        MIN(meeting_index) as first_turn_index,
        MAX(meeting_index) as last_turn_index
      FROM meetings.turns 
      WHERE meeting_id = $1
    `;
    
    const result = await this.databaseAgent.query(query, [meetingId]);
    return result.rows[0];
  }
}