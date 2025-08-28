/**
 * Turn Retrieval - Handles fetching conversation turns for processing
 */

export class TurnRetrieval {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Get turns for processing based on session or specific turn IDs
   */
  async getTurnsForProcessing(clientId, sessionId = null, turnIds = null) {
    let query = `
      SELECT turn_id, content, source_type 
      FROM meetings.turns 
      WHERE client_id = $1
    `;
    let params = [clientId];

    if (turnIds && turnIds.length > 0) {
      query = `
        SELECT turn_id, content, source_type 
        FROM meetings.turns 
        WHERE client_id = $1 AND turn_id = ANY($2)
      `;
      params = [clientId, turnIds];
    } else if (sessionId) {
      // If we had session tracking in turns table, we'd filter by it
      // For now, we'll process recent turns
      query += ` ORDER BY created_at DESC LIMIT 20`;
    } else {
      // Default to recent turns
      query += ` ORDER BY created_at DESC LIMIT 20`;
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Filter turns that are suitable for processing
   */
  filterProcessableTurns(turns) {
    return turns.filter(turn => 
      turn.content && 
      turn.content.trim().length >= 20
    );
  }
}