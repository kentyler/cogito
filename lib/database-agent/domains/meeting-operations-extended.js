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
    const { limit = 50, offset = 0, excludeSystemMeetings = true } = options;
    
    const query = `
      SELECT 
        m.id as block_id,  -- Keep legacy field name for frontend compatibility
        m.name as block_name,       -- Keep legacy field name for frontend compatibility
        m.created_at,
        m.metadata,
        m.meeting_url,
        m.started_at as meeting_start_time,
        m.ended_at as meeting_end_time,
        m.status,
        m.transcript_summary,
        creator.email as created_by_email,
        COUNT(t.id)::integer as turn_count,
        COUNT(CASE WHEN t.content_embedding IS NOT NULL THEN 1 END)::integer as embedded_count,
        COUNT(DISTINCT t.user_id) FILTER (WHERE t.user_id IS NOT NULL)::integer as participant_count,
        array_agg(DISTINCT u.email) FILTER (WHERE u.email IS NOT NULL) as participant_names,
        MIN(t.created_at) as first_turn_time,
        MAX(t.created_at) as last_turn_time
      FROM meetings.meetings m
      LEFT JOIN meetings.turns t ON m.id = t.meeting_id
      LEFT JOIN client_mgmt.users u ON t.user_id = u.id
      LEFT JOIN client_mgmt.users creator ON m.created_by_user_id = creator.id
      WHERE m.client_id = $1
        ${excludeSystemMeetings ? "AND m.meeting_type != 'system'" : ''}
      GROUP BY m.id, m.name, m.created_at, m.metadata, m.meeting_url, m.started_at, m.ended_at, m.status, m.transcript_summary, creator.email
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
   * Get meeting transcript with meeting details
   * @param {string} meetingId - Meeting ID
   * @returns {Object|null} Meeting with transcript and details
   */
  async getTranscript(meetingId) {
    const query = `
      SELECT 
        m.id,
        m.name,
        m.full_transcript#>>'{}'::text[] as full_transcript,
        m.created_at,
        m.started_at,
        m.ended_at,
        m.status,
        creator.email as created_by_email,
        creator.id as created_by_user_id
      FROM meetings.meetings m
      LEFT JOIN client_mgmt.users creator ON m.created_by_user_id = creator.id
      WHERE m.id = $1
    `;
    const result = await this.connector.query(query, [meetingId]);
    return result.rows[0] || null;
  }

  /**
   * Get meeting details with creator information
   * @param {string} meetingId - Meeting ID
   * @returns {Object|null} Meeting details with creator
   */
  async getMeetingWithCreator(meetingId) {
    const query = `
      SELECT 
        m.*,
        creator.email as created_by_email,
        creator.id as created_by_user_id,
        COUNT(t.id)::integer as turn_count,
        COUNT(DISTINCT t.user_id) FILTER (WHERE t.user_id IS NOT NULL)::integer as participant_count
      FROM meetings.meetings m
      LEFT JOIN client_mgmt.users creator ON m.created_by_user_id = creator.id
      LEFT JOIN meetings.turns t ON m.id = t.meeting_id
      WHERE m.id = $1
      GROUP BY m.id, creator.email, creator.id
    `;
    const result = await this.connector.query(query, [meetingId]);
    return result.rows[0] || null;
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