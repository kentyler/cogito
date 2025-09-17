/**
 * Client Operations Stats - Statistical operations for client analysis
 */

export class ClientOperationsStats {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get client statistics including user count, meetings, etc.
   * @param {number} clientId - Client ID
   * @returns {Object} Client statistics
   */
  async getClientStats(clientId) {
    const query = `
      SELECT 
        c.id,
        c.name,
        (SELECT COUNT(*) FROM client_mgmt.user_clients uc WHERE uc.client_id = c.id AND uc.is_active = true)::int as user_count,
        (SELECT COUNT(*) FROM meetings.meetings m WHERE m.client_id = c.id)::int as meeting_count,
        (SELECT COUNT(*) FROM meetings.turns t WHERE t.client_id = c.id AND t.source_type = 'file_upload')::int as file_count
      FROM client_mgmt.clients c
      WHERE c.id = $1
    `;
    
    const result = await this.connector.query(query, [clientId]);
    const row = result.rows[0];
    if (!row) return null;
    
    // Ensure counts are numbers
    return {
      ...row,
      user_count: parseInt(row.user_count) || 0,
      meeting_count: parseInt(row.meeting_count) || 0,
      file_count: parseInt(row.file_count) || 0
    };
  }

  /**
   * Get all clients with their statistics
   * @returns {Array} Array of clients with statistics
   */
  async getAllClientsWithStats() {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.created_at,
        c.story,
        (SELECT COUNT(*) FROM client_mgmt.user_clients uc WHERE uc.client_id = c.id AND uc.is_active = true)::int as user_count,
        (SELECT COUNT(*) FROM meetings.meetings m WHERE m.client_id = c.id)::int as meeting_count,
        (SELECT COUNT(*) FROM meetings.turns t WHERE t.client_id = c.id AND t.source_type = 'file_upload')::int as file_count
      FROM client_mgmt.clients c
      ORDER BY c.name ASC
    `;
    
    const result = await this.connector.query(query);
    // Ensure counts are numbers for all rows
    return result.rows.map(row => ({
      ...row,
      user_count: parseInt(row.user_count) || 0,
      meeting_count: parseInt(row.meeting_count) || 0,
      file_count: parseInt(row.file_count) || 0
    }));
  }
}