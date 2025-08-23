/**
 * Client Operations User Management - User-client association operations
 */

export class ClientOperationsUserMgmt {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get users assigned to a specific client
   * @param {number} clientId - Client ID
   * @returns {Promise<Array>} Array of user records
   */
  async getClientUsers(clientId) {
    const query = `
      SELECT 
        u.id, 
        u.email, 
        uc.role, 
        uc.is_active,
        u.created_at
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.users u ON u.id = uc.user_id
      WHERE uc.client_id = $1 AND uc.is_active = true
      ORDER BY u.email ASC
    `;
    
    const result = await this.connector.query(query, [clientId]);
    return result.rows;
  }

  /**
   * Add or update a user's access to a client
   * @param {number} userId - User ID
   * @param {number} clientId - Client ID
   * @param {string} role - User role
   * @returns {Promise<Object>} User-client association
   */
  async addUserToClient(userId, clientId, role) {
    const query = `
      INSERT INTO client_mgmt.user_clients (user_id, client_id, role, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (user_id, client_id) 
      DO UPDATE SET role = $3, is_active = true
      RETURNING *
    `;
    
    const result = await this.connector.query(query, [userId, clientId, role]);
    return result.rows[0];
  }

  /**
   * Remove user from client (soft delete by setting is_active = false)
   * @param {number} userId - User ID
   * @param {number} clientId - Client ID
   * @returns {Promise<boolean>} True if removed, false if not found
   */
  async removeUserFromClient(userId, clientId) {
    const query = `
      UPDATE client_mgmt.user_clients 
      SET is_active = false
      WHERE user_id = $1 AND client_id = $2
      RETURNING *
    `;
    
    const result = await this.connector.query(query, [userId, clientId]);
    return result.rows.length > 0;
  }

  /**
   * Check if user has access to a specific client
   * @param {number} userId - User ID
   * @param {number} clientId - Client ID
   * @returns {Promise<boolean>} True if user has access, false otherwise
   */
  async checkUserClientAccess(userId, clientId) {
    const query = `
      SELECT 1 FROM client_mgmt.user_clients 
      WHERE user_id = $1 AND client_id = $2 AND is_active = true
    `;
    
    const result = await this.connector.query(query, [userId, clientId]);
    return result.rows.length > 0;
  }
}