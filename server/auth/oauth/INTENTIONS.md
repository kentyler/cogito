# OAuth Provider System

## Purpose
OAuth provider abstraction layer that provides consistent authentication integration across multiple OAuth providers. Implements the OAuth 2.0 authorization code flow with provider-specific configurations and user profile normalization.

## Core OAuth Components

### `oauth-provider.js`
**Purpose**: Base OAuth provider interface and common functionality
- Defines abstract interface that all OAuth providers must implement
- Provides common configuration patterns and callback path generation
- Standardizes user profile normalization across providers
- Establishes contract for authorization, token exchange, and profile retrieval

```javascript
export class OAuthProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.callbackPath = `/auth/callback/${name}`;
  }
  
  getAuthorizationUrl(state) {
    // 1. Must be implemented by specific provider
    // 2. Generate provider-specific authorization URL
    // 3. Include CSRF protection state parameter
    // 4. Return complete authorization URL for redirect
    throw new Error('getAuthorizationUrl must be implemented by provider');
  }
  
  async exchangeCodeForTokens(code) {
    // 1. Must be implemented by specific provider
    // 2. Exchange authorization code for access/refresh tokens
    // 3. Handle provider-specific token response format
    // 4. Return normalized token object
    throw new Error('exchangeCodeForTokens must be implemented by provider');
  }
  
  async getUserProfile(tokens) {
    // 1. Must be implemented by specific provider
    // 2. Use access token to retrieve user profile
    // 3. Handle provider-specific profile API
    // 4. Return raw profile data for normalization
    throw new Error('getUserProfile must be implemented by provider');
  }
  
  normalizeProfile(profile) {
    // 1. Convert provider-specific profile to standard format
    // 2. Extract common fields (id, email, name, picture)
    // 3. Preserve raw profile data for provider-specific needs
    // 4. Return normalized user profile object
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
```

### `google-oauth-provider.js`
**Purpose**: Google OAuth 2.0 provider implementation
- Implements Google-specific OAuth 2.0 authorization flow
- Uses Google Auth Library for secure token handling
- Provides ID token verification and profile extraction
- Handles Google-specific scopes and authorization parameters

```javascript
export class GoogleOAuthProvider extends OAuthProvider {
  constructor(config) {
    super('google', config);
    
    // 1. Validate required Google OAuth configuration
    if (!config.clientId || !config.clientSecret) {
      throw new Error('Google OAuth requires clientId and clientSecret');
    }
    
    // 2. Initialize Google OAuth2Client with credentials
    this.client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri || `${config.baseUrl}/auth/callback/google`
    );
    
    // 3. Set default OAuth scopes for user authentication
    this.scopes = config.scopes || [
      'openid',
      'email',
      'profile'
    ];
  }
  
  getAuthorizationUrl(state) {
    // 1. Generate Google OAuth authorization URL
    // 2. Configure access type and scopes
    // 3. Include state parameter for CSRF protection
    // 4. Force account selection for better UX
    return this.client.generateAuthUrl({
      access_type: 'online',
      scope: this.scopes,
      state: state,
      prompt: 'select_account'
    });
  }
  
  async exchangeCodeForTokens(code) {
    try {
      // 1. Exchange authorization code for Google tokens
      const { tokens } = await this.client.getToken(code);
      
      // 2. Set credentials on client for subsequent requests
      this.client.setCredentials(tokens);
      
      // 3. Return tokens for profile retrieval
      return tokens;
    } catch (error) {
      // 4. Handle token exchange errors gracefully
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }
  
  async getUserProfile(tokens) {
    try {
      // 1. Set credentials for authenticated requests
      this.client.setCredentials(tokens);
      
      // 2. Verify ID token authenticity and integrity
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.config.clientId
      });
      
      // 3. Extract verified user profile from ID token
      const payload = ticket.getPayload();
      
      // 4. Normalize Google profile to standard format
      return this.normalizeProfile({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
        locale: payload.locale
      });
    } catch (error) {
      // 5. Handle profile retrieval errors
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }
  
  normalizeProfile(profile) {
    // 1. Convert Google profile to standard format
    // 2. Include Google-specific fields like email verification
    // 3. Preserve locale information
    // 4. Return consistent profile structure
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
```

## OAuth Provider Configuration

### Google OAuth Configuration
```javascript
{
  clientId: string,           // Google OAuth client ID
  clientSecret: string,       // Google OAuth client secret
  redirectUri?: string,       // Custom redirect URI (optional)
  baseUrl: string,           // Application base URL for callback generation
  scopes?: string[]          // Custom OAuth scopes (optional)
}
```

### Normalized User Profile Structure
```javascript
{
  provider: string,          // OAuth provider name (e.g., 'google')
  providerId: string,        // Unique user ID from provider
  email: string,            // User email address
  emailVerified?: boolean,   // Email verification status (if available)
  name: string,             // Display name
  picture?: string,         // Profile picture URL
  locale?: string,          // User locale (if available)
  raw: object              // Original provider profile data
}
```

## Integration with Authentication System

### Provider Registration
```javascript
export class OAuthManager {
  constructor() {
    this.providers = new Map();
  }
  
  registerProvider(providerClass, config) {
    // 1. Instantiate provider with configuration
    const provider = new providerClass(config);
    
    // 2. Validate provider implements required interface
    this.validateProvider(provider);
    
    // 3. Register provider for authentication flows
    this.providers.set(provider.name, provider);
    
    return provider;
  }
  
  getProvider(name) {
    // 1. Retrieve registered provider by name
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`OAuth provider '${name}' not found`);
    }
    return provider;
  }
  
  validateProvider(provider) {
    // 1. Ensure provider implements required methods
    const requiredMethods = ['getAuthorizationUrl', 'exchangeCodeForTokens', 'getUserProfile'];
    
    for (const method of requiredMethods) {
      if (typeof provider[method] !== 'function') {
        throw new Error(`Provider '${provider.name}' missing required method: ${method}`);
      }
    }
  }
}
```

### Authentication Flow Integration
```javascript
export class AuthenticationController {
  async initiateOAuth(req, res, providerName) {
    try {
      // 1. Get OAuth provider instance
      const provider = this.oauthManager.getProvider(providerName);
      
      // 2. Generate CSRF protection state
      const state = this.generateSecureState();
      req.session.oauthState = state;
      
      // 3. Get provider authorization URL
      const authUrl = provider.getAuthorizationUrl(state);
      
      // 4. Redirect user to provider authorization page
      return res.redirect(authUrl);
    } catch (error) {
      console.error(`OAuth initiation error for ${providerName}:`, error);
      return ApiResponses.internalError(res, 'Authentication initialization failed');
    }
  }
  
  async handleOAuthCallback(req, res, providerName) {
    try {
      // 1. Validate CSRF state parameter
      if (req.query.state !== req.session.oauthState) {
        throw new Error('Invalid OAuth state parameter');
      }
      
      // 2. Get OAuth provider instance
      const provider = this.oauthManager.getProvider(providerName);
      
      // 3. Exchange authorization code for tokens
      const tokens = await provider.exchangeCodeForTokens(req.query.code);
      
      // 4. Retrieve user profile using tokens
      const profile = await provider.getUserProfile(tokens);
      
      // 5. Process authentication (create/login user)
      const authResult = await this.processUserAuthentication(profile);
      
      // 6. Clear OAuth state from session
      delete req.session.oauthState;
      
      // 7. Handle successful authentication
      return this.handleSuccessfulAuth(req, res, authResult);
    } catch (error) {
      console.error(`OAuth callback error for ${providerName}:`, error);
      return this.handleAuthError(req, res, error);
    }
  }
}
```

## Security Considerations

### State Parameter CSRF Protection
```javascript
export class OAuthSecurityManager {
  generateSecureState() {
    // 1. Generate cryptographically secure random state
    return crypto.randomBytes(32).toString('hex');
  }
  
  validateState(sessionState, requestState) {
    // 1. Ensure state exists in session
    if (!sessionState) {
      throw new Error('Missing OAuth state in session');
    }
    
    // 2. Perform constant-time comparison
    if (sessionState !== requestState) {
      throw new Error('OAuth state mismatch - potential CSRF attack');
    }
    
    return true;
  }
}
```

### Token Security
```javascript
export class TokenSecurityManager {
  secureTokenStorage(tokens, sessionId) {
    // 1. Encrypt tokens before storage
    const encryptedTokens = this.encrypt(tokens);
    
    // 2. Store with session association
    // 3. Set appropriate expiration
    // 4. Return secure token reference
  }
  
  validateTokenIntegrity(tokens, provider) {
    // 1. Verify token signature (for JWT tokens)
    // 2. Check token expiration
    // 3. Validate audience and issuer
    // 4. Return validation result
  }
}
```

## Error Handling Patterns

### Provider Configuration Errors
```javascript
try {
  const googleProvider = new GoogleOAuthProvider(config);
} catch (error) {
  if (error.message.includes('clientId')) {
    console.error('Google OAuth misconfiguration: Missing client ID');
    // Handle configuration error appropriately
  }
  throw new Error('OAuth provider initialization failed');
}
```

### Authentication Flow Errors
```javascript
export class OAuthErrorHandler {
  handleAuthorizationError(error, provider) {
    // 1. Log provider-specific error details
    console.error(`${provider} authorization error:`, error);
    
    // 2. Classify error type
    if (error.message.includes('access_denied')) {
      return { type: 'USER_DENIED', message: 'User denied authorization' };
    }
    
    if (error.message.includes('invalid_client')) {
      return { type: 'CONFIG_ERROR', message: 'OAuth configuration invalid' };
    }
    
    // 3. Return generic error for unclassified errors
    return { type: 'AUTH_ERROR', message: 'Authentication failed' };
  }
}
```

## Adding New OAuth Providers

### Provider Implementation Template
```javascript
export class NewOAuthProvider extends OAuthProvider {
  constructor(config) {
    super('newprovider', config);
    
    // 1. Validate provider-specific configuration
    this.validateConfig(config);
    
    // 2. Initialize provider-specific client/library
    this.initializeClient(config);
    
    // 3. Set provider-specific defaults
    this.setDefaults(config);
  }
  
  getAuthorizationUrl(state) {
    // 1. Build provider-specific authorization URL
    // 2. Include required parameters and scopes
    // 3. Add CSRF state parameter
    // 4. Return complete authorization URL
  }
  
  async exchangeCodeForTokens(code) {
    // 1. Make provider token exchange request
    // 2. Handle provider-specific response format
    // 3. Validate token response
    // 4. Return normalized tokens
  }
  
  async getUserProfile(tokens) {
    // 1. Make authenticated profile request
    // 2. Handle provider profile API format
    // 3. Extract required profile fields
    // 4. Return profile for normalization
  }
}
```

## Testing Strategies

### Provider Unit Testing
```javascript
describe('GoogleOAuthProvider', () => {
  let provider;
  let mockConfig;
  
  beforeEach(() => {
    mockConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      baseUrl: 'http://localhost:3000'
    };
    provider = new GoogleOAuthProvider(mockConfig);
  });
  
  test('generates authorization URL with correct parameters', () => {
    const state = 'test-state';
    const authUrl = provider.getAuthorizationUrl(state);
    
    expect(authUrl).toContain('accounts.google.com/oauth/authorize');
    expect(authUrl).toContain(`state=${state}`);
    expect(authUrl).toContain('scope=openid%20email%20profile');
  });
  
  test('normalizes Google profile correctly', () => {
    const googleProfile = {
      id: '12345',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true
    };
    
    const normalized = provider.normalizeProfile(googleProfile);
    
    expect(normalized.provider).toBe('google');
    expect(normalized.providerId).toBe('12345');
    expect(normalized.emailVerified).toBe(true);
  });
});
```

### Integration Testing
```javascript
describe('OAuth Integration', () => {
  test('complete OAuth flow', async () => {
    // 1. Mock OAuth provider responses
    // 2. Simulate authorization and callback
    // 3. Verify user authentication
    // 4. Check session creation
  });
  
  test('handles OAuth errors gracefully', async () => {
    // 1. Simulate various OAuth error scenarios
    // 2. Verify appropriate error handling
    // 3. Check error logging and user feedback
  });
});
```