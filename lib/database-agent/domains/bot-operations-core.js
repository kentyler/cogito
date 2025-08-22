/**
 * Bot Operations Core - Basic bot lifecycle and status management
 * Handles bot status transitions and meeting updates
 * Schema verified: recall_bot_id, user_id from meetings.meetings table, bot_id alias
 */

// Schema verified: recall_bot_id, user_id from meetings.meetings table, bot_id alias
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
        id,
        recall_bot_id as bot_id,
        meeting_url,
        name as meeting_name,
        status,
        created_at,
        updated_at
      FROM meetings.meetings
      WHERE status = 'active' 
        AND meeting_type != 'system'
      ORDER BY created_at DESC
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
   * @param {string} botId - Bot ID (recall_bot_id)
   * @returns {Object} Updated meeting record
   */
  async setBotStatusLeaving(botId) {
    const query = `
      UPDATE meetings.meetings 
      SET status = 'leaving', updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING *
    `;

    const result = await this.connector.query(query, [botId]);
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