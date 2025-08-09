/**
 * Meeting Operations Core - Basic CRUD and Status Operations
 */

export class MeetingOperationsCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get meeting by bot ID (for cleanup service)
   * @param {string} botId - Recall bot ID
   * @param {Array} excludeStatuses - Statuses to exclude
   * @returns {Object|null} Meeting object or null
   */
  async getByBotId(botId, excludeStatuses = ['completed', 'inactive']) {
    let query = 'SELECT * FROM meetings.meetings WHERE recall_bot_id = $1';
    const params = [botId];
    
    if (excludeStatuses.length > 0) {
      const statusPlaceholders = excludeStatuses.map((_, i) => `$${i + 2}`).join(', ');
      query += ` AND status NOT IN (${statusPlaceholders})`;
      params.push(...excludeStatuses);
    }
    
    const result = await this.connector.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Get meeting by ID
   * @param {string} meetingId - Meeting UUID
   * @returns {Object|null} Meeting object or null
   */
  async getById(meetingId) {
    const query = 'SELECT * FROM meetings.meetings WHERE id = $1';
    const result = await this.connector.query(query, [meetingId]);
    return result.rows[0] || null;
  }

  /**
   * Update meeting status
   * @param {string} botId - Recall bot ID
   * @param {string} status - New status
   * @returns {Object} Updated meeting
   */
  async updateStatus(botId, status) {
    const query = `
      UPDATE meetings.meetings 
      SET status = $2,
          ended_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE ended_at END,
          updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING *
    `;
    const result = await this.connector.query(query, [botId, status]);
    return result.rows[0];
  }

  /**
   * Create a new meeting
   * @param {Object} meetingData - Meeting data
   * @returns {Object} Created meeting
   */
  async create(meetingData) {
    const {
      name,
      description,
      meeting_type,
      created_by_user_id,
      client_id,
      metadata = {}
    } = meetingData;
    
    const query = `
      INSERT INTO meetings.meetings (
        id, name, description, meeting_type, created_by_user_id, client_id, metadata, created_at, updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await this.connector.query(query, [
      name, description, meeting_type, created_by_user_id, client_id, metadata
    ]);
    return result.rows[0];
  }

  /**
   * Delete meeting with cascading turn deletion
   * @param {string} meetingId - Meeting UUID
   * @returns {Object} Deletion result
   */
  async delete(meetingId) {
    return await this.connector.transaction(async (client) => {
      // First get all turn IDs
      const turnsResult = await client.query(`
        SELECT id FROM meetings.turns WHERE meeting_id = $1
      `, [meetingId]);
      
      const turnIds = turnsResult.rows.map(row => row.id);
      
      // Delete turns if any exist
      if (turnIds.length > 0) {
        const turnIdsList = turnIds.map((_, i) => `$${i + 1}`).join(',');
        await client.query(`DELETE FROM meetings.turns WHERE id IN (${turnIdsList})`, turnIds);
      }
      
      // Delete the meeting
      const meetingResult = await client.query(
        'DELETE FROM meetings.meetings WHERE id = $1 RETURNING *',
        [meetingId]
      );
      
      return {
        meeting: meetingResult.rows[0],
        deletedTurns: turnIds.length
      };
    });
  }
}