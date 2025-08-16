/**
 * User Preferences Operations - Database operations for user preferences
 * Handles user preferences for avatars, LLMs, and clients
 */

export class UserOperationsPreferences {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get user preferences (avatar, LLM, client)
   * @param {number} userId - User ID
   * @returns {Object|null} User preferences
   */
  async getUserPreferences(userId) {
    const query = `
      SELECT last_llm_id, last_client_id, last_avatar_id
      FROM client_mgmt.users 
      WHERE id = $1
    `;
    const result = await this.connector.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Get specific user preference field
   * @param {number} userId - User ID
   * @param {string} field - Field name (last_avatar_id, last_llm_id, last_client_id)
   * @returns {any} Field value or null
   */
  async getUserPreference(userId, field) {
    const allowedFields = ['last_avatar_id', 'last_llm_id', 'last_client_id'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid preference field: ${field}`);
    }
    
    const query = `
      SELECT ${field}
      FROM client_mgmt.users 
      WHERE id = $1
    `;
    const result = await this.connector.query(query, [userId]);
    return result.rows[0] ? result.rows[0][field] : null;
  }

  /**
   * Update user preference
   * @param {number} userId - User ID
   * @param {string} field - Field name (last_avatar_id, last_llm_id, last_client_id)
   * @param {any} value - New value
   * @returns {Object} Updated user preferences
   */
  async updateUserPreference(userId, field, value) {
    const allowedFields = ['last_avatar_id', 'last_llm_id', 'last_client_id'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Invalid preference field: ${field}`);
    }
    
    const query = `
      UPDATE client_mgmt.users 
      SET ${field} = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING last_llm_id, last_client_id, last_avatar_id
    `;
    const result = await this.connector.query(query, [value, userId]);
    return result.rows[0];
  }

  /**
   * Get user's client with role by client ID
   * @param {number} userId - User ID
   * @param {number} clientId - Client ID
   * @returns {Object|null} Client info with role
   */
  async getUserClientById(userId, clientId) {
    const query = `
      SELECT 
        c.id as client_id,
        c.name as client_name,
        uc.role
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true
    `;
    const result = await this.connector.query(query, [userId, clientId]);
    return result.rows[0] || null;
  }

  /**
   * Get user's default client (first active client)
   * @param {number} userId - User ID
   * @returns {Object|null} Default client info
   */
  async getUserDefaultClient(userId) {
    const query = `
      SELECT uc.client_id, c.name as client_name, uc.role
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON c.id = uc.client_id
      WHERE uc.user_id = $1 AND uc.is_active = true
      LIMIT 1
    `;
    const result = await this.connector.query(query, [userId]);
    return result.rows[0] || null;
  }
}