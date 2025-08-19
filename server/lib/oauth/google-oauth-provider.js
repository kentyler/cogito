import { OAuth2Client } from 'google-auth-library';
import { OAuthProvider } from './oauth-provider.js';

/**
 * Google OAuth 2.0 provider implementation
 */
export class GoogleOAuthProvider extends OAuthProvider {
  constructor(config) {
    super('google', config);
    
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Google OAuth requires clientId and clientSecret');
    }
    
    this.client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri || `${config.baseUrl}/auth/callback/google`
    );
    
    this.scopes = config.scopes || [
      'openid',
      'email',
      'profile'
    ];
  }

  /**
   * Get Google OAuth authorization URL
   */
  getAuthorizationUrl(state) {
    return this.client.generateAuthUrl({
      access_type: 'online',
      scope: this.scopes,
      state: state,
      prompt: 'select_account' // Always show account selection
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const { tokens } = await this.client.getToken(code);
      this.client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Get user profile from Google
   */
  async getUserProfile(tokens) {
    try {
      // Set credentials for this request
      this.client.setCredentials(tokens);
      
      // Verify and decode the ID token
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.config.clientId
      });
      
      const payload = ticket.getPayload();
      
      return this.normalizeProfile({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
        locale: payload.locale
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Normalize Google profile to standard format
   */
  normalizeProfile(profile) {
    return {
      provider: 'google',
      providerId: profile.id,
      email: profile.email,
      emailVerified: profile.email_verified,
      name: profile.name,
      picture: profile.picture,
      locale: profile.locale,
      raw: profile
    };
  }
}