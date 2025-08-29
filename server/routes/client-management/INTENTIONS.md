# Client Management Routes

## Purpose
HTTP endpoints for client selection, switching, and management operations. Handles multi-tenant client access, user-client relationships, and client context management within user sessions.

## Core Route Files

### `index.js`
**Purpose**: Main client management router and route coordination
- Aggregates client management routes
- Provides unified client management interface
- Coordinates client selection and switching flows
- Handles route middleware and security

```javascript
// Main client management routes
router.use('/select', clientSelectionRoutes);
router.use('/switch', clientSwitchingRoutes);
router.use('/oauth', clientOAuthRoutes);
```

### `selection.js`
**Purpose**: Client selection interface and processing
- GET `/selection` - Serve client selection page
- POST `/select-client` - Process client selection
- Handles initial client selection after authentication
- Manages client list display and user choice

```javascript
router.get('/selection', async (req, res) => {
  // 1. Verify user authentication
  // 2. Fetch user's accessible clients via DatabaseAgent
  // 3. Render client selection interface
  // 4. Include client metadata and permissions
});

router.post('/select-client', handleClientSelection);
// Delegates to handlers/client-selector.js
```

### `core.js`
**Purpose**: Core client management utilities and shared functions
- Client access validation utilities
- Client context management functions
- Shared client operation helpers
- Client permission checking

```javascript
export async function validateClientAccess(userId, clientId) {
  // 1. Initialize DatabaseAgent
  // 2. Check user has access to specified client
  // 3. Validate client is active and accessible
  // 4. Return validation result with client details
}

export async function getUserAccessibleClients(userId) {
  // 1. Query user's client relationships via DatabaseAgent
  // 2. Filter active and accessible clients
  // 3. Include client metadata and permissions
  // 4. Return formatted client list
}
```

### `oauth.js`
**Purpose**: OAuth-specific client management
- Handles client assignment after OAuth authentication
- Manages OAuth user client relationships
- Processes OAuth callback client context
- Coordinates OAuth and client selection flows

```javascript
router.post('/oauth/assign', async (req, res) => {
  // 1. Validate OAuth session state
  // 2. Process client assignment for OAuth users
  // 3. Handle single vs multi-client scenarios
  // 4. Create session context and redirect
});
```

### `handlers/` Subdirectory
Contains focused handler modules (documented in separate INTENTIONS.md):
- `client-selector.js` - Initial client selection logic
- `client-switcher.js` - Client switching for authenticated users

## Client Management Flows

### Initial Client Selection Flow
1. **Authentication**: User completes login/OAuth
2. **Client Query**: System fetches user's accessible clients
3. **Selection Logic**:
   - Single client → Auto-assign and redirect
   - Multiple clients → Show selection interface
4. **Selection Processing**: POST to `/select-client`
5. **Session Setup**: Create client session with meeting
6. **Application Redirect**: Send user to main application

### Client Switching Flow
1. **Switch Request**: Authenticated user requests client switch
2. **Validation**: Verify user has access to target client
3. **Context Switch**: Update session client context
4. **Meeting Creation**: Create new session meeting for new client
5. **Confirmation**: Return success response with new context

### OAuth Client Assignment
1. **OAuth Completion**: OAuth provider callback completes
2. **User Processing**: User created/updated in database
3. **Client Discovery**: Query user's accessible clients
4. **Assignment Logic**: Handle single/multi-client scenarios
5. **Session Creation**: Establish session with client context

## Database Integration

### Client Operations (via DatabaseAgent)
- `clientOperations.getUserClients(userId)` - Get user's accessible clients
- `clientOperations.getClientById(clientId)` - Fetch client details
- `clientOperations.checkUserAccess(userId, clientId)` - Validate access
- `clientOperations.getClientSettings(clientId)` - Get client configuration

### User Operations (via DatabaseAgent)
- `userOperations.updateLastClient(userId, clientId)` - Track last selected client
- `userOperations.getUserClientRelationships(userId)` - Get all client relationships

### Session Operations
- Session meeting creation after client selection/switch
- Session context updates for client changes
- Meeting isolation between client contexts

## Request/Response Patterns

### Client Selection Request
```javascript
POST /client-management/select-client
{
  "client_id": number
}
```

### Client Switch Request
```javascript
POST /client-management/switch-client
{
  "client_id": number
}
```

### Success Response
```javascript
{
  "success": true,
  "message": "Client selected/switched successfully",
  "client": {
    "client_id": number,
    "name": string,
    "settings": object
  },
  "redirect_url": string
}
```

### Client List Response
```javascript
{
  "clients": [
    {
      "client_id": number,
      "name": string,
      "description": string,
      "permissions": [string],
      "is_default": boolean
    }
  ],
  "user": {
    "name": string,
    "email": string
  }
}
```

## Security Patterns

### Access Control
- User authentication verification before client operations
- Client access permission validation
- Resource isolation between clients
- Session security and client context protection

### Permission Validation
- User-client relationship verification
- Client status and availability checking
- Permission boundary enforcement
- Audit logging for client access changes

### Data Isolation
- Client-specific data segregation
- Cross-client data access prevention
- Meeting isolation between client contexts
- Secure client switching without data leakage

## Session Management

### Session State Before Client Selection
```javascript
req.session = {
  user: {
    user_id: number,
    email: string,
    name: string
  },
  // No client_id yet
  pending_oauth: object // If from OAuth flow
}
```

### Session State After Client Selection
```javascript
req.session = {
  user: {
    user_id: number,
    email: string,
    name: string
  },
  client_id: number,
  meeting_id: string, // New session meeting
  client_context: {
    name: string,
    permissions: [string],
    settings: object
  }
}
```

## Error Handling

### Selection Errors
- No accessible clients → Show appropriate message, contact admin
- Invalid client selection → 400 Bad Request with available options
- Client access denied → 403 Forbidden with explanation

### Authentication Errors
- Unauthenticated requests → 401 Unauthorized, redirect to login
- Expired sessions → 401 Unauthorized, clear session and redirect

### Database Errors
- Client query failures → 500 Internal Server Error
- Session creation failures → Log error, retry or show error message
- Access validation failures → Log security event, deny access

## Frontend Integration

### Client Selection Interface
- Dynamic client list rendering
- Client description and permission display
- Selection form handling and submission
- Loading states and error display

### Client Switching Interface
- Client switcher UI component
- Current client display
- Switch confirmation and feedback
- Session continuity indicators

## Testing Strategies

### Route Testing
- Client selection endpoint testing
- Authentication requirement testing
- Permission boundary validation
- Error condition handling

### Integration Testing
- Full client selection flow testing
- OAuth integration with client assignment
- Session management across client switches
- Multi-client user scenario testing

### Security Testing
- Unauthorized access attempts
- Cross-client data access testing
- Session security validation
- Permission escalation prevention

## Performance Considerations

### Client Data Caching
- Cache frequently accessed client data
- Efficient client list queries
- Session context optimization
- Database query optimization

### Session Efficiency
- Minimal session data storage
- Efficient client context switching
- Optimized database operations
- Connection pooling and management