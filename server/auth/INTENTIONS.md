# Authentication System

## Purpose
Manages user authentication, OAuth integration, client session management, and automatic meeting creation for web conversations. **All authentication operations must create session meetings to ensure data integrity.**

## Core Components

### Session Meeting Integration
**Critical Pattern**: Every authenticated session must have a meeting for turn association.

```javascript
// REQUIRED: After successful authentication
const meetingId = await createSessionMeeting(pool, userId, clientId);
req.session.meeting_id = meetingId;
```

### Files and Responsibilities

#### `session-meeting.js`
**Purpose**: Creates web session meetings for conversation turns
- Generates UUID-based meeting IDs  
- Creates meetings with type 'cogito_web'
- Stores in `meetings.meetings` table via DatabaseAgent
- **Must be called** after client selection/switching

```javascript
export async function createSessionMeeting(pool, user_id, client_id) {
  // Creates meeting with specific metadata for web sessions
  // Returns meeting_id for req.session storage
}
```

#### `client-session-manager.js` 
**Purpose**: Session setup with client selection and mini-horde support
- Validates client access permissions
- Sets up session variables (user_id, client_id, email)
- Handles both regular clients and mini-horde instances
- **Must call createSessionMeeting** after client assignment

```javascript
export async function setupClientSession(req, userId, email, clientId) {
  // 1. Validate client access via DatabaseAgent
  // 2. Setup session variables
  // 3. Create session meeting
  // 4. Return success/failure
}
```

#### `oauth-callback-handler.js`
**Purpose**: OAuth provider callback processing
- Exchanges authorization code for user info
- Creates or updates user records via DatabaseAgent
- Delegates to client assignment logic
- Handles provider-specific user data normalization

```javascript
export async function handleOAuthCallback(req, res, provider, providerName) {
  // 1. Exchange code for user data
  // 2. Create/update user in database
  // 3. Handle client assignment
  // 4. Redirect to application
}
```

#### `oauth-client-assignment.js`
**Purpose**: Client assignment logic after OAuth authentication
- Auto-assigns single-client users
- Redirects multi-client users to selection page
- Creates session meetings for immediate assignment
- Handles client switching scenarios

```javascript
export async function handleClientAssignment(req, res, user) {
  // 1. Query user's client access
  // 2. Auto-assign if single client
  // 3. Redirect to selection if multiple clients
  // 4. Create session meeting for assigned clients
}
```

#### `oauth/google-oauth-provider.js`
**Purpose**: Google OAuth implementation
- Implements OAuth provider interface
- Handles Google-specific token exchange
- Normalizes Google user data to standard format

```javascript
export class GoogleOAuthProvider {
  async exchangeCodeForUser(code) {
    // Google OAuth2 flow implementation
  }
}
```

#### `oauth/oauth-provider.js`
**Purpose**: Abstract OAuth provider base class
- Defines OAuth provider interface
- Common OAuth utilities and patterns

```javascript
export class OAuthProvider {
  // Base class for OAuth implementations
}
```

## Authentication Flow

### OAuth Authentication
1. **Initiate**: User clicks OAuth provider login
2. **Callback**: Provider redirects with authorization code  
3. **Exchange**: `oauth-callback-handler.js` exchanges code for user data
4. **User Management**: Create/update user via DatabaseAgent
5. **Client Assignment**: `oauth-client-assignment.js` handles client selection
6. **Session Setup**: `client-session-manager.js` sets up session variables
7. **Meeting Creation**: `session-meeting.js` creates web conversation meeting
8. **Ready**: User can start conversations with turn association

### Session Variables (req.session)
```javascript
{
  user: {
    user_id: number,
    email: string,
    name: string,
    oauth_provider: string
  },
  client_id: number,
  meeting_id: string  // Critical for turn association
}
```

## Database Integration

### User Operations (via DatabaseAgent)
- `userOperations.createOAuthUser(userData)` - Create OAuth user
- `userOperations.findByEmail(email)` - Find existing user
- `userOperations.getUserClients(userId)` - Get user's client access

### Meeting Operations (via DatabaseAgent)  
- `meetingOperations.createMeeting(meetingData)` - Create session meeting

### Client Operations (via DatabaseAgent)
- `clientOperations.getClientById(clientId)` - Validate client access
- `clientOperations.checkUserAccess(userId, clientId)` - Permission check

## Security Patterns

### OAuth Security
- State parameter validation to prevent CSRF
- Secure token exchange with provider APIs
- User data validation and sanitization

### Session Security  
- Express session with secure cookie settings
- Client access validation on every request
- Meeting ownership verification

## Error Handling

### OAuth Errors
- Invalid authorization codes → Redirect to login with error
- Provider API failures → Log error, show user-friendly message
- User creation failures → DatabaseAgent error handling

### Session Errors
- Client access denied → Clear session, redirect to login
- Missing client assignment → Redirect to client selection
- Meeting creation failures → Log error, may affect conversation functionality

## Development Patterns

### Adding New OAuth Providers
1. Create provider class extending `OAuthProvider`
2. Implement `exchangeCodeForUser(code)` method
3. Add provider to initialization in main auth routes
4. Update callback handling to support provider-specific data

### Testing Authentication
- Mock OAuth providers for unit tests
- Test client assignment with various user/client combinations  
- Verify session meeting creation in all auth paths
- Test permission boundaries and error scenarios