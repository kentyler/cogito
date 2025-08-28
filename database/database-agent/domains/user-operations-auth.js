/**
 * User Authentication Operations - Authentication and security operations
 * Handles user login, authentication, and account creation
 */

import bcrypt from 'bcryptjs';

export class UserOperationsAuth {
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
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password
   * @param {Object} userData.metadata - Optional metadata
   * @returns {Object} Created user (without password hash)
   */
  async create(userData) {
    const { email, password, metadata = {} } = userData;
    
    try {
      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);
      
      const query = `
        INSERT INTO client_mgmt.users (email, password_hash: _password_hash, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, email, created_at, metadata
      `;
      
      const result = await this.connector.query(query, [email, passwordHash, metadata]);
      const user = result.rows[0];
      
      // Log successful user creation
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logEvent('user_created', {
          user_id: user.id,
          email: user.email
        }, {
          severity: 'info',
          component: 'UserOperations'
        });
      }
      
      return user;
    } catch (error) {
      // Log user creation errors
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logError('user_creation_failed', error, {
          email: email,
          component: 'UserOperations',
          severity: 'error'
        });
      }
      throw error;
    }
  }

  /**
   * Authenticate a user with email and password
   * Combines findUsersByEmail and password verification
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Object|null} Authenticated user (without password hash) or null
   */
  async authenticate(email, password) {
    try {
      // Find all users with this email
      const users = await this.findUsersByEmail(email);
      
      if (users.length === 0) {
        // Log failed authentication attempt
        const eventLogger = this.connector.getEventLogger();
        if (eventLogger) {
          await eventLogger.logEvent('authentication_failed', {
            email: email,
            reason: 'user_not_found'
          }, {
            severity: 'warning',
            component: 'UserOperations'
          });
        }
        return null;
      }
      
      // Check password against all matching users (in case of duplicates)
      for (const user of users) {
        if (user.password_hash && await bcrypt.compare(password, user.password_hash)) {
          // Log successful authentication
          const eventLogger = this.connector.getEventLogger();
          if (eventLogger) {
            await eventLogger.logEvent('authentication_successful', {
              user_id: user.id,
              email: user.email
            }, {
              severity: 'info',
              component: 'UserOperations'
            });
          }
          
          // Return user without password hash
          const { password_hash, ...authenticatedUser } = user;
          return authenticatedUser;
        }
      }
      
      // Log failed password authentication
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logEvent('authentication_failed', {
          email: email,
          reason: 'invalid_password'
        }, {
          severity: 'warning',
          component: 'UserOperations'
        });
      }
      
      return null;
    } catch (error) {
      // Log authentication errors
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logError('authentication_error', error, {
          email: email,
          component: 'UserOperations',
          severity: 'error'
        });
      }
      throw error;
    }
  }
}