# Client Management Handlers

## Purpose
Focused handler modules for client selection and switching operations. These handle the specific business logic for managing user-client relationships and session transitions.

## Core Functions

### `client-selector.js`
**Purpose**: Handles initial client selection after login
- Processes client selection from first-time or multi-client users
- Validates client access permissions
- Sets up session variables and creates session meeting
- Handles both OAuth pending authentication and existing sessions

```javascript
export async function handleClientSelection(req, res) {
  // 1. Validate client_id from request body
  // 2. Check authentication state (pending OAuth or existing session)
  // 3. Validate user has access to selected client via DatabaseAgent
  // 4. Setup client session with setupClientSession()
  // 5. Create session meeting for conversation turns
  // 6. Return success response with redirect URL
}
```

**Error Handling**:
- Missing client_id → 400 Bad Request
- Invalid authentication state → 401 Unauthorized  
- Client access denied → 403 Forbidden
- Database errors → 500 Internal Server Error

### `client-switcher.js`
**Purpose**: Handles client switching for authenticated users
- Allows users to switch between accessible clients
- Validates existing authentication and client permissions
- Creates new session meeting for the switched client context
- Maintains session continuity while changing client context

```javascript
export async function handleClientSwitch(req, res) {
  // 1. Validate client_id from request body
  // 2. Verify user is authenticated (req.session.user exists)
  // 3. Validate user has access to target client
  // 4. Setup new client session context
  // 5. Create fresh session meeting for new client context
  // 6. Return success response
}
```

**Error Handling**:
- Missing client_id → 400 Bad Request
- Not authenticated → 401 Unauthorized
- Client access denied → 403 Forbidden
- Session setup failures → 500 Internal Server Error

## Dependencies

### Core Dependencies
- `#server/auth/client-session-manager.js` - Session setup utilities
- `#database/database-agent.js` - Database operations
- `#server/auth/session-meeting.js` - Session meeting creation
- `#server/api/api-responses.js` - Standardized API responses

### DatabaseAgent Operations
- `clientOperations.getClientById(clientId)` - Validate client exists
- `clientOperations.checkUserAccess(userId, clientId)` - Permission validation
- `userOperations.updateLastClient(userId, clientId)` - Track user's last selected client

## Request/Response Patterns

### Request Format
```javascript
POST /client-management/select-client
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
  "redirect_url": "/",
  "client_name": string
}
```

### Error Response
```javascript
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

## Session State Management

### Before Client Selection
```javascript
req.session = {
  pending_oauth: {
    user_id: number,
    email: string,
    provider: string
  }
  // OR existing authenticated session without client_id
}
```

### After Client Selection/Switch
```javascript
req.session = {
  user: {
    user_id: number,
    email: string,
    name: string
  },
  client_id: number,
  meeting_id: string  // Critical for turn association
}
```

## Security Patterns

### Permission Validation
- Always validate user has access to requested client
- Use DatabaseAgent for consistent permission checking
- Log client selection events for audit trail

### Session Security
- Verify authentication state before processing
- Clear old session meeting when switching clients
- Maintain user identity while changing client context

## Integration Points

### Authentication Flow
1. User completes OAuth or login
2. System determines client access (single vs multiple)
3. Auto-select for single client OR redirect to selection
4. Handler processes selection and sets up session
5. User redirected to main application

### Conversation System
- Session meeting creation enables turn association
- Each client switch creates new conversation context
- Meeting isolation ensures data privacy between clients

## Testing Strategies

### Unit Tests
- Test client validation with various user/client combinations
- Verify session state transitions
- Test error handling for invalid requests
- Mock DatabaseAgent operations

### Integration Tests  
- Test full client selection flow from OAuth callback
- Verify client switching maintains authentication
- Test permission boundaries and access controls
- Validate session meeting creation and isolation