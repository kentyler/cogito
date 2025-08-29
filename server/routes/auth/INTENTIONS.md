# Authentication Routes

## Purpose
HTTP endpoints for user authentication, session management, and OAuth integration. Handles login flows, session validation, and user authentication state management.

## Core Route Files

### `index.js`
**Purpose**: Main authentication router and route aggregation
- Aggregates all authentication routes
- Provides unified auth routing interface
- Handles route middleware application
- Coordinates authentication flow entry points

```javascript
// Main authentication routes
router.use('/login', loginRoutes);
router.use('/oauth', oauthRoutes); 
router.use('/logout', logoutRoutes);
router.use('/check', authCheckRoutes);
```

### `login.js`
**Purpose**: Traditional login endpoints and form handling
- GET `/login` - Serve login page
- POST `/login` - Process login credentials
- Handles traditional email/password authentication
- Integrates with session management

```javascript
router.post('/login', async (req, res) => {
  // 1. Validate credentials (email/password)
  // 2. Authenticate user via DatabaseAgent
  // 3. Create user session
  // 4. Handle client assignment/selection
  // 5. Redirect to application or client selection
});
```

### `oauth.js`
**Purpose**: OAuth provider integration endpoints
- GET `/oauth/:provider` - Initiate OAuth flow
- GET `/oauth/:provider/callback` - Handle OAuth callbacks
- Supports multiple OAuth providers (Google, etc.)
- Handles OAuth state management and security

```javascript
router.get('/oauth/:provider', (req, res) => {
  // 1. Generate OAuth state parameter
  // 2. Build provider authorization URL
  // 3. Store state in session for security
  // 4. Redirect user to OAuth provider
});

router.get('/oauth/:provider/callback', async (req, res) => {
  // 1. Validate OAuth state parameter
  // 2. Exchange authorization code for user data
  // 3. Create or update user via DatabaseAgent
  // 4. Handle client assignment logic
  // 5. Create session and redirect to application
});
```

### `logout.js`
**Purpose**: Session termination and cleanup
- POST `/logout` - Terminate user session
- Session cleanup and security
- Redirect handling after logout

```javascript
router.post('/logout', (req, res) => {
  // 1. Clear session data
  // 2. Invalidate authentication tokens
  // 3. Clear client context
  // 4. Redirect to login page
});
```

### `check.js`
**Purpose**: Authentication status validation
- GET `/check` - Check current authentication status
- Returns user and session information
- Used by frontend for authentication state

```javascript
router.get('/check', (req, res) => {
  // 1. Validate session exists and is active
  // 2. Return user information and permissions
  // 3. Include client context if available
  // 4. Return authentication status
});
```

### `session-management.js`
**Purpose**: Session lifecycle management
- Session creation and initialization
- Session data management
- Session expiration handling
- Cross-request session consistency

```javascript
export async function createUserSession(req, user, clientId) {
  // 1. Initialize session object
  // 2. Store user information
  // 3. Set client context if provided
  // 4. Create session meeting for conversations
  // 5. Set session expiration
}
```

### `middleware.js`
**Purpose**: Authentication middleware functions
- Session validation middleware
- Authentication requirement enforcement
- Client context validation
- Route protection utilities

```javascript
export function requireAuth(req, res, next) {
  // 1. Check session exists and is valid
  // 2. Verify user authentication
  // 3. Attach user context to request
  // 4. Continue to route or return 401
}

export function requireClient(req, res, next) {
  // 1. Check client context exists in session
  // 2. Validate client access permissions
  // 3. Attach client context to request
  // 4. Continue or redirect to client selection
}
```

## Authentication Flows

### OAuth Authentication Flow
1. **Initiate**: GET `/auth/oauth/:provider`
2. **Provider Auth**: User authenticates with OAuth provider
3. **Callback**: GET `/auth/oauth/:provider/callback`
4. **User Processing**: Create/update user via DatabaseAgent
5. **Client Assignment**: Handle client selection logic
6. **Session Creation**: Establish user session with client context
7. **Redirect**: Send user to application or client selection

### Traditional Login Flow
1. **Login Page**: GET `/auth/login`
2. **Credentials**: POST `/auth/login` with email/password
3. **Validation**: Authenticate credentials via DatabaseAgent
4. **Session Setup**: Create user session
5. **Client Context**: Handle client assignment
6. **Redirect**: Send to application

### Session Validation
1. **Check Request**: GET `/auth/check`
2. **Session Validation**: Verify session exists and is active
3. **User Context**: Return user information and permissions
4. **Client Context**: Include client data if available

## Session Management

### Session Structure
```javascript
req.session = {
  user: {
    user_id: number,
    email: string,
    name: string,
    oauth_provider: string
  },
  client_id: number,
  meeting_id: string,
  created_at: Date,
  expires_at: Date
}
```

### Session Security
- Secure session cookies
- Session expiration handling
- Cross-site request forgery protection
- Session regeneration on privilege changes

## Database Integration

### User Operations
- `userOperations.findByEmail(email)` - Find user for login
- `userOperations.validateCredentials(email, password)` - Credential validation
- `userOperations.createOAuthUser(userData)` - OAuth user creation
- `userOperations.updateLastLogin(userId)` - Track login activity

### Client Operations
- `clientOperations.getUserClients(userId)` - Get accessible clients
- `clientOperations.checkUserAccess(userId, clientId)` - Validate access
- `clientOperations.getClientById(clientId)` - Client information

## Error Handling

### Authentication Errors
- Invalid credentials → 401 Unauthorized
- OAuth provider failures → Redirect with error message
- Session expired → 401 Unauthorized with redirect
- Client access denied → 403 Forbidden

### OAuth Errors
- Invalid state parameter → Security error, redirect to login
- Authorization denied → User cancelled, redirect to login
- Provider API errors → Log error, show user-friendly message

### Session Errors
- Session creation failures → 500 Internal Server Error
- Client assignment errors → Redirect to client selection
- Permission validation failures → 403 Forbidden

## Security Patterns

### OAuth Security
- State parameter validation to prevent CSRF attacks
- Secure token exchange with provider APIs
- User data validation and sanitization
- Provider-specific security considerations

### Session Security
- Secure cookie configuration
- Session fixation prevention
- Cross-site request forgery protection
- Session data encryption

### Input Security
- Credential sanitization
- SQL injection prevention via DatabaseAgent
- XSS prevention in responses
- Rate limiting on authentication endpoints

## Response Patterns

### Authentication Success
```javascript
{
  "success": true,
  "user": {
    "name": string,
    "email": string
  },
  "redirect_url": string,
  "requires_client_selection": boolean
}
```

### Authentication Failure
```javascript
{
  "success": false,
  "error": "Authentication failed",
  "code": "INVALID_CREDENTIALS"
}
```

### Session Status
```javascript
{
  "authenticated": boolean,
  "user": {
    "user_id": number,
    "name": string,
    "email": string
  },
  "client": {
    "client_id": number,
    "name": string
  }
}
```

## Integration Points

### Frontend Integration
- Authentication status checking
- Login/logout form handling
- OAuth provider button integration
- Client selection interface

### Conversation System
- Session meeting creation after authentication
- User context for conversation turns
- Client context for data isolation

### Client Management
- Client selection after authentication
- Multi-client user handling
- Permission boundary enforcement

## Testing Strategies

### Authentication Testing
- Credential validation testing
- OAuth flow integration testing
- Session management testing
- Error condition handling

### Security Testing
- Authentication bypass attempts
- Session security validation
- CSRF protection testing
- OAuth security verification

### Integration Testing
- Full authentication flows
- Client assignment integration
- Session persistence across requests
- Cross-route authentication state