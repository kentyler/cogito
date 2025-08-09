/**
 * User Operations - Database operations for user authentication and client management
 */

import bcrypt from 'bcryptjs';

export class UserOperations {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Find users by email (case-insensitive with trimming)
   * Used for login - handles potential duplicate emails
   * @param {string} email - User email
   * @returns {Array} Array of matching users with password hashes
   */
  async findUsersByEmail(email) {
    const query = `
      SELECT id, email, password_hash 
      FROM client_mgmt.users 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
    `;
    const result = await this.connector.query(query, [email]);
    return result.rows;
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

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password
   * @param {Object} userData.metadata - Optional metadata
   * @returns {Object} Created user (without password hash)
   */
  async create(userData) {
    const { email, password, metadata = {} } = userData;
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO client_mgmt.users (email, password_hash, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, email, created_at, metadata
    `;
    
    const result = await this.connector.query(query, [email, passwordHash, metadata]);
    return result.rows[0];
  }

  /**
   * Authenticate a user with email and password
   * Combines findUsersByEmail and password verification
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Object|null} Authenticated user (without password hash) or null
   */
  async authenticate(email, password) {
    // Find all users with this email
    const users = await this.findUsersByEmail(email);
    
    if (users.length === 0) {
      return null;
    }
    
    // Check password against all matching users (in case of duplicates)
    for (const user of users) {
      if (user.password_hash && await bcrypt.compare(password, user.password_hash)) {
        // Return user without password hash
        const { password_hash, ...authenticatedUser } = user;
        return authenticatedUser;
      }
    }
    
    return null;
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
}