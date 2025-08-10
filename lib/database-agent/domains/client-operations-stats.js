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
        (SELECT COUNT(*) FROM client_mgmt.user_clients uc WHERE uc.client_id = c.id AND uc.is_active = true) as user_count,
        (SELECT COUNT(*) FROM meetings.meetings m WHERE m.client_id = c.id) as meeting_count,
        (SELECT COUNT(*) FROM context.files f WHERE f.client_id = c.id) as file_count
      FROM client_mgmt.clients c
      WHERE c.id = $1
    `;
    
    const result = await this.connector.query(query, [clientId]);
    return result.rows[0] || null;
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
        (SELECT COUNT(*) FROM client_mgmt.user_clients uc WHERE uc.client_id = c.id AND uc.is_active = true) as user_count,
        (SELECT COUNT(*) FROM meetings.meetings m WHERE m.client_id = c.id) as meeting_count,
        (SELECT COUNT(*) FROM context.files f WHERE f.client_id = c.id) as file_count
      FROM client_mgmt.clients c
      ORDER BY c.name ASC
    `;
    
    const result = await this.connector.query(query);
    return result.rows;
  }
}