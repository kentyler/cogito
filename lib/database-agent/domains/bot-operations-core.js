/**
 * Bot Operations Core - Basic bot lifecycle and status management
 * Handles bot status transitions and meeting updates
 * Schema verified: recall_bot_id, created_by_user_id from meetings.meetings table, bot_id alias
 */

// Schema verified: recall_bot_id, created_by_user_id from meetings.meetings table, bot_id alias
export class BotOperationsCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get all currently active bot meetings
   * @returns {Array} Active bot meetings with status info
   */
  async getActiveBots() {
    const query = `
      SELECT 
        m.id,
        m.recall_bot_id as bot_id,
        m.meeting_url,
        m.name as meeting_name,
        m.status,
        m.meeting_type,
        m.created_at,
        m.updated_at,
        u.email as creator_email
      FROM meetings.meetings m
      LEFT JOIN client_mgmt.users u ON m.created_by_user_id = u.id
      WHERE m.status = 'active' 
        AND m.meeting_type = 'meeting'
        AND m.recall_bot_id IS NOT NULL
      ORDER BY m.created_at DESC
    `;

    const result = await this.connector.query(query);
    return result.rows;
  }

  /**
   * Get meetings stuck in 'joining' status
   * @returns {Array} Stuck bot meetings that need intervention
   */
  async getStuckMeetings() {
    const query = `
      SELECT 
        id,
        id as meeting_id,
        meeting_url,
        name as meeting_name,
        status,
        created_at,
        updated_at,
        recall_bot_id as bot_id,
        0 as turn_count
      FROM meetings.meetings
      WHERE status = 'joining' 
        AND meeting_type != 'system' 
        AND recall_bot_id IS NOT NULL
      ORDER BY created_at DESC
    `;

    const result = await this.connector.query(query);
    return result.rows;
  }

  /**
   * Force complete a stuck meeting
   * @param {string} botId - Bot ID (recall_bot_id)
   * @returns {Object} Updated meeting record
   */
  async forceCompleteMeeting(botId) {
    const query = `
      UPDATE meetings.meetings 
      SET status = 'completed', updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING *
    `;

    const result = await this.connector.query(query, [botId]);
    return result.rows[0] || null;
  }

  /**
   * Set bot status to 'leaving' when shutdown is initiated
   * @param {string} botId - Bot ID (recall_bot_id or meeting id)
   * @returns {Object} Updated meeting record
   */
  async setBotStatusLeaving(botId) {
    console.log('setBotStatusLeaving called with botId:', botId, 'type:', typeof botId);
    
    // First, determine what type of meeting this is
    // Need to cast properly for PostgreSQL type comparison
    const lookupQuery = `
      SELECT id, recall_bot_id, meeting_type, status 
      FROM meetings.meetings 
      WHERE id::text = $1 OR recall_bot_id = $1
    `;
    
    const lookupResult = await this.connector.query(lookupQuery, [botId]);
    
    if (lookupResult.rows.length === 0) {
      console.log('No meeting found with ID:', botId);
      return null;
    }
    
    const meeting = lookupResult.rows[0];
    console.log('Found meeting:', meeting.meeting_type, 'with recall_bot_id:', meeting.recall_bot_id);
    
    let updateQuery;
    let newStatus;
    
    if (meeting.meeting_type === 'meeting' && meeting.recall_bot_id) {
      // Actual bot meeting - set to 'leaving' status for Recall API shutdown
      newStatus = 'leaving';
      updateQuery = `
        UPDATE meetings.meetings 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
    } else {
      // Web session - set directly to 'inactive' 
      newStatus = 'inactive';
      updateQuery = `
        UPDATE meetings.meetings 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
    }
    
    console.log('Setting meeting status to:', newStatus);
    const result = await this.connector.query(updateQuery, [newStatus, meeting.id]);
    return result.rows[0] || null;
  }

  /**
   * Set bot status to 'inactive' after leave completion
   * @param {string} botId - Bot ID (recall_bot_id)
   * @returns {Object} Update confirmation
   */
  async setBotStatusInactive(botId) {
    const query = `
      UPDATE meetings.meetings 
      SET status = 'inactive', updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING id, status, updated_at
    `;

    const result = await this.connector.query(query, [botId]);
    return result.rows[0] || null;
  }

  /**
   * Generic method to update meeting status for bots
   * @param {string} botId - Bot ID (recall_bot_id)
   * @param {string} status - New status to set
   * @returns {Object} Updated meeting record
   */
  async updateMeetingStatus(botId, status) {
    const query = `
      UPDATE meetings.meetings 
      SET status = $2, updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING id, status, updated_at, recall_bot_id
    `;

    const result = await this.connector.query(query, [botId, status]);
    return result.rows[0] || null;
  }
}