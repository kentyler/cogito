/**
 * Turn Operations Core - Basic CRUD operations for conversation turns
 * Handles turn creation, retrieval, and deletion
 */

export class TurnOperationsCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Create a conversation turn with optional embedding
   * @param {Object} turnData - Turn data
   * @returns {Object} Created turn
   */
  async createTurn(turnData) {
    const {
      id = null,
      user_id,
      content,
      source_type,
      source_id,
      metadata = {},
      content_embedding = null,
      meeting_id,
      client_id = null,
      meeting_index = null,
      timestamp = new Date()
    } = turnData;

    const query = `
      INSERT INTO meetings.turns (
        id,
        meeting_id,
        client_id,
        user_id,
        content, 
        source_type, 
        source_id, 
        metadata,
        content_embedding,
        meeting_index,
        timestamp,
        created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
      RETURNING id, created_at, metadata
    `;

    const result = await this.connector.query(query, [
      id || await this._generateUUID(),
      meeting_id,
      client_id,
      user_id,
      content,
      source_type,
      source_id,
      metadata,
      content_embedding,
      meeting_index,
      timestamp
    ]);
    
    return result.rows[0];
  }

  /**
   * Get turn by ID
   * @param {string} turnId - Turn UUID
   * @returns {Object|null} Turn object or null
   */
  async getById(turnId) {
    const query = 'SELECT * FROM meetings.turns WHERE id = $1';
    const result = await this.connector.query(query, [turnId]);
    return result.rows[0] || null;
  }

  /**
   * Get turns for a meeting
   * @param {string} meetingId - Meeting UUID
   * @param {Object} options - Query options
   * @returns {Array} Array of turns
   */
  async getByMeetingId(meetingId, options = {}) {
    const { limit = 1000, offset = 0, orderBy = 'timestamp ASC' } = options;
    
    const query = `
      SELECT * FROM meetings.turns 
      WHERE meeting_id = $1 
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.connector.query(query, [meetingId, limit, offset]);
    return result.rows;
  }

  /**
   * Delete turn by ID
   * @param {string} turnId - Turn UUID
   * @returns {Object} Deleted turn
   */
  async delete(turnId) {
    const query = 'DELETE FROM meetings.turns WHERE id = $1 RETURNING *';
    const result = await this.connector.query(query, [turnId]);
    return result.rows[0];
  }

  /**
   * Delete all turns for a meeting
   * @param {string} meetingId - Meeting UUID
   * @returns {number} Number of deleted turns
   */
  async deleteByMeetingId(meetingId) {
    const query = 'DELETE FROM meetings.turns WHERE meeting_id = $1 RETURNING id';
    const result = await this.connector.query(query, [meetingId]);
    return result.rows.length;
  }

  /**
   * Update turn embedding
   * @param {string} turnId - Turn ID
   * @param {string} embedding - Embedding vector
   * @returns {Object} Updated turn
   */
  async updateEmbedding(turnId, embedding) {
    const query = `
      UPDATE meetings.turns 
      SET content_embedding = $2 
      WHERE id = $1 
      RETURNING id, content_embedding IS NOT NULL as has_embedding
    `;
    
    const result = await this.connector.query(query, [turnId, embedding]);
    return result.rows[0];
  }

  /**
   * Generate a UUID for new turns
   * @private
   */
  async _generateUUID() {
    const result = await this.connector.query('SELECT gen_random_uuid() as id');
    return result.rows[0].id;
  }
}