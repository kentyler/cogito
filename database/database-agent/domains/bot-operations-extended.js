/**
 * Bot Operations Extended - Bot analytics and advanced queries
 * Handles bot statistics, status filtering, and detailed bot info
 */

export class BotOperationsExtended {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get bot meeting by bot ID with detailed status
   * @param {string} botId - Bot ID (recall_bot_id)
   * @returns {Object|null} Bot meeting details or null
   */
  async getBotMeeting(botId) {
    const query = `
      SELECT 
        id,
        recall_bot_id as bot_id,
        meeting_url,
        name as meeting_name,
        status,
        meeting_type,
        created_at,
        updated_at,
        metadata
      FROM meetings.meetings
      WHERE recall_bot_id = $1
      AND meeting_type != 'system'
    `;

    const result = await this.connector.query(query, [botId]);
    return result.rows[0] || null;
  }

  /**
   * Get bot statistics and status overview
   * @returns {Object} Bot status statistics
   */
  async getBotStats() {
    const query = `
      SELECT 
        COUNT(*) as total_bot_meetings,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bots,
        COUNT(CASE WHEN status = 'joining' THEN 1 END) as joining_bots,
        COUNT(CASE WHEN status = 'leaving' THEN 1 END) as leaving_bots,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bots,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_bots,
        MAX(updated_at) as last_activity
      FROM meetings.meetings
      WHERE recall_bot_id IS NOT NULL
        AND meeting_type != 'system'
    `;

    const result = await this.connector.query(query);
    const stats = result.rows[0];

    return {
      total_bot_meetings: parseInt(stats.total_bot_meetings),
      active_bots: parseInt(stats.active_bots),
      joining_bots: parseInt(stats.joining_bots),
      leaving_bots: parseInt(stats.leaving_bots),
      completed_bots: parseInt(stats.completed_bots),
      inactive_bots: parseInt(stats.inactive_bots),
      last_activity: stats.last_activity
    };
  }

  /**
   * Get all bots with a specific status
   * @param {string} status - Status to filter by
   * @param {number} limit - Maximum number of results
   * @returns {Array} Bot meetings with specified status
   */
  async getBotsByStatus(status, limit = 100) {
    const query = `
      SELECT 
        id,
        recall_bot_id as bot_id,
        meeting_url,
        name as meeting_name,
        status,
        created_at,
        updated_at,
        metadata
      FROM meetings.meetings
      WHERE status = $1 
        AND recall_bot_id IS NOT NULL
        AND meeting_type != 'system'
      ORDER BY updated_at DESC
      LIMIT $2
    `;

    const result = await this.connector.query(query, [status, limit]);
    return result.rows;
  }
}