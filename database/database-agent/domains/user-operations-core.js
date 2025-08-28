/**
 * User Operations Core - Basic CRUD operations for users
 */

import bcrypt from 'bcryptjs';

export class UserOperationsCore {
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
   * Get all active client associations for a user with hierarchical structure
   * @param {number} userId - User ID
   * @returns {Array} Array of client associations with roles and parent-child relationships
   */
  async getUserClients(userId) {
    const query = `
      SELECT 
        uc.client_id,
        uc.role,
        c.name as client_name,
        c.parent_client_id,
        pc.name as parent_client_name,
        CASE 
          WHEN c.parent_client_id IS NULL THEN 'parent'
          ELSE 'mini-horde'
        END as client_type
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      LEFT JOIN client_mgmt.clients pc ON c.parent_client_id = pc.id
      WHERE uc.user_id = $1 AND uc.is_active = true
      ORDER BY 
        COALESCE(pc.name, c.name) ASC,  -- Sort by parent name first
        c.parent_client_id ASC,         -- Parents before children
        c.name ASC                      -- Then by client name
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

  /**
   * Create a new user (basic operation without event logging)
   * @param {Object} userData - User data
   * @returns {Object} Created user (without password hash)
   */
  async createUser(userData) {
    const { email, password, metadata = {} } = userData;
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO client_mgmt.users (email, password_hash: _password_hash, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, email, created_at, metadata
    `;
    
    const result = await this.connector.query(query, [email, passwordHash, metadata]);
    return result.rows[0];
  }

  /**
   * Authenticate user with basic password check (without event logging)
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Object|null} Authenticated user or null
   */
  async authenticateUser(email, password) {
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
}