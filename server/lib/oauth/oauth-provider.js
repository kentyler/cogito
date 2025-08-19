/**
 * Base OAuth provider interface
 * Provides common functionality for all OAuth providers
 */
export class OAuthProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.callbackPath = `/auth/callback/${name}`;
  }

  /**
   * Get the authorization URL for this provider
   * @param {string} state - CSRF protection state
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state) {
    throw new Error('getAuthorizationUrl must be implemented by provider');
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForTokens(code) {
    throw new Error('exchangeCodeForTokens must be implemented by provider');
  }

  /**
   * Get user profile from provider
   * @param {Object} tokens - OAuth tokens
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(tokens) {
    throw new Error('getUserProfile must be implemented by provider');
  }

  /**
   * Normalize user profile to standard format
   * @param {Object} profile - Provider-specific profile
   * @returns {Object} Normalized profile
   */
  normalizeProfile(profile) {
    return {
      provider: this.name,
      providerId: profile.id || profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      raw: profile
    };
  }
}