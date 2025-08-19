/**
 * User OAuth Operations - OAuth authentication and account management
 * Handles OAuth user creation, linking, and profile updates
 */

export class UserOperationsOAuth {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  async findByEmail(email) {
    const query = `
      SELECT id, email, name, metadata, created_at 
      FROM client_mgmt.users 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      LIMIT 1
    `;
    const result = await this.connector.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user from OAuth profile
   * @param {Object} oauthData - OAuth profile data
   * @returns {Object} Created user
   */
  async createFromOAuth(oauthData) {
    const { email, name, provider, providerId, picture, emailVerified } = oauthData;
    
    try {
      // Create metadata for OAuth user
      const metadata = {
        oauth_provider: provider,
        oauth_provider_id: providerId,
        picture: picture,
        email_verified: emailVerified,
        created_via: 'oauth',
        last_login: new Date().toISOString()
      };
      
      const query = `
        INSERT INTO client_mgmt.users (
          email, 
          name, 
          metadata, 
          created_at, 
          updated_at
        )
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, email, name, metadata, created_at
      `;
      
      const result = await this.connector.query(query, [email, name, metadata]);
      const user = result.rows[0];
      
      // Log OAuth user creation
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logEvent('oauth_user_created', {
          user_id: user.id,
          email: user.email,
          provider: provider
        }, {
          severity: 'info',
          component: 'UserOperationsOAuth'
        });
      }
      
      return user;
    } catch (error) {
      // Log OAuth user creation error
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logError('oauth_user_creation_failed', error, {
          email: email,
          provider: provider,
          component: 'UserOperationsOAuth',
          severity: 'error'
        });
      }
      throw error;
    }
  }

  /**
   * Update OAuth information for existing user
   * @param {number} userId - User ID
   * @param {Object} oauthInfo - OAuth info to update
   * @returns {boolean} Success status
   */
  async updateOAuthInfo(userId, oauthInfo) {
    try {
      // Get current metadata
      const currentQuery = `
        SELECT metadata FROM client_mgmt.users WHERE id = $1
      `;
      const currentResult = await this.connector.query(currentQuery, [userId]);
      
      if (currentResult.rows.length === 0) {
        return false;
      }
      
      // Merge OAuth info into metadata
      const currentMetadata = currentResult.rows[0].metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        oauth_provider: oauthInfo.provider,
        oauth_provider_id: oauthInfo.providerId,
        picture: oauthInfo.picture || currentMetadata.picture,
        last_login: new Date().toISOString(),
        last_oauth_login: new Date().toISOString()
      };
      
      // Update user
      const updateQuery = `
        UPDATE client_mgmt.users 
        SET metadata = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `;
      
      const result = await this.connector.query(updateQuery, [userId, updatedMetadata]);
      
      // Log OAuth info update
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logEvent('oauth_info_updated', {
          user_id: userId,
          provider: oauthInfo.provider
        }, {
          severity: 'info',
          component: 'UserOperationsOAuth'
        });
      }
      
      return result.rows.length > 0;
    } catch (error) {
      // Log OAuth update error
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logError('oauth_update_failed', error, {
          user_id: userId,
          component: 'UserOperationsOAuth',
          severity: 'error'
        });
      }
      throw error;
    }
  }

  /**
   * Link OAuth account to existing user
   * @param {number} userId - User ID
   * @param {Object} oauthData - OAuth profile data
   * @returns {boolean} Success status
   */
  async linkOAuthAccount(userId, oauthData) {
    const { provider, providerId, picture } = oauthData;
    
    return await this.updateOAuthInfo(userId, {
      provider,
      providerId,
      picture,
      linkedAt: new Date().toISOString()
    });
  }
}