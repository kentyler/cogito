# Server Routes

## Purpose
HTTP endpoint definitions and route handlers for the Cogito backend API. Implements RESTful patterns with Express.js routing, standardized error handling, and consistent DatabaseAgent integration.

## Architecture Philosophy
- **Thin Routes**: Routes handle only HTTP concerns, delegate business logic to handlers or DatabaseAgent
- **Modular Organization**: Related routes grouped into subdirectories by domain
- **Standardized Responses**: All routes use ApiResponses for consistent formatting
- **DatabaseAgent Integration**: No direct SQL - all database operations through DatabaseAgent
- **Session-Based Auth**: Authentication via req.session, not JWT tokens

## Route Organization

### Main Route Files

#### `conversations.js`
**Purpose**: Main conversational interface endpoint
- POST `/conversational-turn` - Process user messages and generate AI responses
- Delegates to modular handlers in `conversations/` subdirectory
- Handles streaming responses and error management

#### `chat-interface.js` 
**Purpose**: Chat interface routing and access control
- Serves chat interface for different client types
- Golden Horde access control and permissions
- Integration with frontend routing

#### `bots-create.js`
**Purpose**: Meeting bot creation and management
- POST `/bots/create` - Create Recall.ai bots for meeting recording
- Webhook handling for bot status updates
- Integration with external meeting platforms

#### `browser-capture.js`
**Purpose**: Browser extension conversation capture
- Receives conversations from browser extension
- Processes captured Claude and ChatGPT conversations
- Converts external conversations to internal format

#### `upload-files.js`
**Purpose**: File upload processing and management
- Multi-file upload handling with multer
- File type detection and processing
- Integration with file processing pipeline

#### `webhook-chat.js`
**Purpose**: External webhook handling for chat integrations
- Processes webhooks from external systems
- Chat message normalization and storage
- Integration with conversation system

### Route Subdirectories

#### `auth/` - Authentication Routes
- OAuth provider integration
- Session management
- Login/logout flows
- User authentication validation

#### `client-management/` - Client Management
- Client selection and switching
- Multi-tenant client operations
- Permission management
- Session client context

#### `conversations/` - Conversation Processing
- Modular conversation handlers
- Turn orchestration
- Error handling
- Client resolution

#### `meetings/` - Meeting Management
- Meeting CRUD operations
- Meeting metadata management
- Transcript processing
- Meeting summaries

#### `settings/` - User Settings
- User preference management
- LLM configuration
- Client settings
- Profile management

#### `summary-handlers/` - Summary Generation
- Daily summary generation
- Monthly summary aggregation
- Summary data fetching
- Report generation

## Common Route Patterns

### Standard Route Structure
```javascript
import express from 'express';
import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';

const router = express.Router();

router.post('/endpoint', async (req, res) => {
  try {
    // 1. Validate authentication/session
    if (!req.session?.user?.user_id) {
      return ApiResponses.unauthorized(res, 'Authentication required');
    }
    
    // 2. Extract and validate request data
    const { required_field } = req.body;
    if (!required_field) {
      return ApiResponses.badRequest(res, 'Required field missing');
    }
    
    // 3. Initialize DatabaseAgent
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    // 4. Perform business logic via DatabaseAgent
    const result = await dbAgent.someOperations.performOperation(data);
    
    // 5. Return standardized response
    return ApiResponses.success(res, result, 'Operation completed');
    
  } catch (error) {
    console.error('Route error:', error);
    return ApiResponses.error(res, 500, 'Internal server error');
  }
});

export default router;
```

### Authentication Patterns
```javascript
// Session-based authentication
const userId = req.session?.user?.user_id;
const clientId = req.session?.client_id;

if (!userId) {
  return ApiResponses.unauthorized(res, 'Authentication required');
}

// Client context validation
if (!clientId) {
  return ApiResponses.badRequest(res, 'Client context required');
}
```

### Error Handling Patterns
```javascript
// Consistent error responses
try {
  // Route logic
} catch (error) {
  console.error('Route error:', error);
  
  // Specific error handling
  if (error.code === 'PERMISSION_DENIED') {
    return ApiResponses.forbidden(res, 'Access denied');
  }
  
  if (error.code === 'VALIDATION_ERROR') {
    return ApiResponses.badRequest(res, error.message);
  }
  
  // Generic error fallback
  return ApiResponses.error(res, 500, 'Internal server error');
}
```

## Request/Response Standards

### Request Validation
- Always validate required fields
- Sanitize input data
- Check data types and formats
- Validate business rules

### Response Formatting
```javascript
// Success responses
{
  "success": true,
  "data": {...},
  "message": "Operation completed"
}

// Error responses
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

## Database Integration

### DatabaseAgent Usage
- All database operations use DatabaseAgent
- No direct SQL queries in route files
- Proper connection management
- Transaction handling where needed

```javascript
const dbAgent = new DatabaseAgent();
await dbAgent.connect();

try {
  const result = await dbAgent.domainOperations.operation(data);
  return ApiResponses.success(res, result);
} finally {
  await dbAgent.close();
}
```

## Security Patterns

### Authentication Security
- Session validation on protected routes
- Client access verification
- User permission checking
- Resource ownership validation

### Input Security
- Request data sanitization
- SQL injection prevention (via DatabaseAgent)
- XSS prevention in responses
- Rate limiting considerations

### Data Protection
- User data isolation by client
- Sensitive data masking in responses
- Secure error messaging (no data leakage)
- Audit logging for sensitive operations

## Middleware Integration

### Standard Middleware Stack
- CORS handling
- Request parsing (JSON, multipart)
- Session management
- Authentication middleware
- Error handling middleware

### Route-Specific Middleware
- Authentication requirements
- Client access validation
- Rate limiting
- Request logging

## Testing Strategies

### Route Testing
- HTTP endpoint testing
- Authentication flow testing
- Error condition testing
- Response format validation

### Integration Testing
- Full request/response cycle
- DatabaseAgent integration
- Session management
- Cross-route interaction

### Security Testing
- Authentication bypass attempts
- Permission boundary testing
- Input validation testing
- Error message security

## Performance Considerations

### Response Optimization
- Minimal data transfer
- Efficient database queries
- Response caching where appropriate
- Streaming for large responses

### Connection Management
- DatabaseAgent connection pooling
- Proper resource cleanup
- Connection timeout handling
- Error recovery patterns