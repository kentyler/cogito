/**
 * User Operations - Database operations for user authentication and client management
 */

import { UserOperationsAuth } from './user-operations-auth.js';
import { UserOperationsPreferences } from './user-operations-preferences.js';
import { UserOperationsOAuth } from './user-operations-oauth.js';

export class UserOperations {
  constructor(connector) {
    this.connector = connector;
    this._auth = new UserOperationsAuth(connector);
    this._preferences = new UserOperationsPreferences(connector);
    this._oauth = new UserOperationsOAuth(connector);
  }

  // Authentication operations delegation
  async findUsersByEmail(email) {
    return await this._auth.findUsersByEmail(email);
  }

  /**
   * Get all active client associations for a user
   * @param {number} userId - User ID
   * @returns {Array} Array of client associations with roles
   */
  async getUserClients(userId) {
    const query = `
      SELECT 
        uc.client_id,
        uc.role,
        c.name as client_name
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.is_active = true
      ORDER BY c.name
    `;
    const result = await this.connector.query(query, [userId]);
    return result.rows;
  }

  /**
   * Verify user has access to a specific client
   * @param {number} userId - User ID
   * @param {number} clientId - Client ID
   * @returns {Object|null} Client details if access allowed, null otherwise
   */
  async verifyClientAccess(userId, clientId) {
    const query = `
      SELECT 
        uc.client_id,
        uc.role,
        c.name as client_name
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true
    `;
    const result = await this.connector.query(query, [userId, clientId]);
    return result.rows[0] || null;
  }

  async create(userData) {
    return await this._auth.create(userData);
  }
  async authenticate(email, password) {
    return await this._auth.authenticate(email, password);
  }
  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Object|null} User data (without password hash)
   */
  async getById(userId) {
    const query = `
      SELECT id, email, active, created_at, updated_at, metadata
      FROM client_mgmt.users 
      WHERE id = $1
    `;
    const result = await this.connector.query(query, [userId]);
    return result.rows[0] || null;
  }
  // Preference operations delegation
  async getUserPreferences(userId) {
    return await this._preferences.getUserPreferences(userId);
  }
  async getUserPreference(userId, field) {
    return await this._preferences.getUserPreference(userId, field);
  }
  async updateUserPreference(userId, field, value) {
    return await this._preferences.updateUserPreference(userId, field, value);
  }
  async getUserClientById(userId, clientId) {
    return await this._preferences.getUserClientById(userId, clientId);
  }
  async getUserDefaultClient(userId) {
    return await this._preferences.getUserDefaultClient(userId);
  }
  
  // OAuth operations delegation
  async findByEmail(email) {
    return await this._oauth.findByEmail(email);
  }
  async createFromOAuth(oauthData) {
    return await this._oauth.createFromOAuth(oauthData);
  }
  async updateOAuthInfo(userId, oauthInfo) {
    return await this._oauth.updateOAuthInfo(userId, oauthInfo);
  }
  async linkOAuthAccount(userId, oauthData) {
    return await this._oauth.linkOAuthAccount(userId, oauthData);
  }
}