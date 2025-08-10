/**
 * Meeting Operations Extended - Advanced Operations and Utilities
 */

export class MeetingOperationsExtended {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * List meetings for a client with statistics
   * @param {number} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Array} Array of meetings with stats
   */
  async listWithStats(clientId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    // This is a complex query from the catalog - simplified version
    const query = `
      SELECT 
        m.*,
        COUNT(DISTINCT t.id) as turn_count,
        MIN(t.timestamp) as first_turn_at,
        MAX(t.timestamp) as last_turn_at
      FROM meetings.meetings m
      LEFT JOIN meetings.turns t ON m.id = t.meeting_id
      WHERE m.client_id = $1
      GROUP BY m.id
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.connector.query(query, [clientId, limit, offset]);
    return result.rows;
  }

  /**
   * Get active meetings count for cleanup monitoring
   * @returns {number} Count of active meetings
   */
  async getActiveCount() {
    const query = `
      SELECT COUNT(*) as count
      FROM meetings.meetings 
      WHERE status IN ('joining', 'active') AND meeting_type != 'system'
    `;
    const result = await this.connector.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get active meetings (for cleanup service)
   * @returns {Array} Array of active meetings
   */
  async getActiveMeetings() {
    const query = `
      SELECT recall_bot_id, id, name, status FROM meetings.meetings
      WHERE status IN ('joining', 'active') AND meeting_type != 'system'
    `;
    const result = await this.connector.query(query);
    return result.rows;
  }

  /**
   * Get meetings by recall bot IDs (for cleanup service)
   * @param {Array} botIds - Array of bot IDs
   * @returns {Array} Array of meetings
   */
  async getByBotIds(botIds) {
    if (botIds.length === 0) return [];
    
    const placeholders = botIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT id, recall_bot_id FROM meetings.meetings 
      WHERE recall_bot_id IN (${placeholders})
    `;
    
    const result = await this.connector.query(query, botIds);
    return result.rows;
  }

  /**
   * Get meeting transcript (for email service)
   * @param {string} meetingId - Meeting ID
   * @returns {string|null} Full transcript
   */
  async getTranscript(meetingId) {
    const query = 'SELECT full_transcript FROM meetings.meetings WHERE id = $1';
    const result = await this.connector.query(query, [meetingId]);
    return result.rows[0]?.full_transcript || null;
  }

  /**
   * Mark email as sent
   * @param {string} meetingId - Meeting ID
   * @returns {Object} Updated meeting
   */
  async markEmailSent(meetingId) {
    const query = `
      UPDATE meetings.meetings 
      SET email_sent = TRUE 
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.connector.query(query, [meetingId]);
    return result.rows[0];
  }
}