# Conversation Route Handlers

## Purpose
Modular conversation handling components that orchestrate the conversation flow, manage client context, handle errors, and coordinate meeting associations.

## Core Components

### `turn-orchestrator.js`
**Purpose**: Main orchestration of conversational turns
- Coordinates the entire conversation flow from request to response
- Manages LLM interactions and response generation
- Handles turn storage and embedding generation
- Integrates with DatabaseAgent for consistent data operations

```javascript
export async function processConversationalTurn(req, res) {
  // 1. Extract and validate turn data from request
  // 2. Resolve client context via client-resolver
  // 3. Build conversation context (previous turns, files)
  // 4. Generate LLM response via appropriate provider
  // 5. Store turn and response via DatabaseAgent
  // 6. Generate embeddings for semantic search
  // 7. Return formatted response to client
}
```

**Key Responsibilities**:
- Turn validation and preprocessing
- LLM provider coordination
- Turn persistence via DatabaseAgent
- Response formatting and streaming
- Error delegation to error-handler

### `client-resolver.js` 
**Purpose**: Resolves and validates client context for conversations
- Determines active client from session or request
- Validates user access to client resources
- Provides client configuration for LLM interactions
- Handles client-specific settings and permissions

```javascript
export async function resolveClientContext(req) {
  // 1. Extract client information from session or request
  // 2. Validate client exists and user has access
  // 3. Fetch client configuration (LLM settings, permissions)
  // 4. Return client context object for conversation processing
}
```

**Context Resolution**:
- Session-based client identification
- Client permission validation
- Configuration loading for LLM interactions
- Access control enforcement

### `meeting-manager.js`
**Purpose**: Manages meeting context for conversation turns
- Ensures all turns are associated with proper meetings
- Handles meeting creation for orphaned conversations
- Manages meeting metadata and lifecycle
- Coordinates with session meeting system

```javascript
export async function ensureMeetingContext(req, clientId) {
  // 1. Check for existing meeting_id in session
  // 2. Validate meeting exists and belongs to user/client
  // 3. Create new session meeting if needed
  // 4. Update session with meeting_id
  // 5. Return meeting context for turn association
}
```

**Meeting Association**:
- Session meeting validation and creation
- Meeting ownership verification
- Turn-to-meeting relationship enforcement
- Meeting metadata management

### `error-handler.js`
**Purpose**: Centralized error handling for conversation operations
- Provides consistent error responses
- Logs conversation errors with context
- Handles different error types (validation, LLM, database)
- Maintains conversation state on recoverable errors

```javascript
export async function handleConversationError(error, req, res, context) {
  // 1. Classify error type and severity
  // 2. Log error with conversation context
  // 3. Determine if error is recoverable
  // 4. Return appropriate error response to client
  // 5. Clean up any partial conversation state
}
```

**Error Categories**:
- Validation errors (malformed requests)
- Authentication/authorization errors
- LLM provider errors (rate limits, API failures)
- Database errors (connection, constraint violations)
- Business logic errors (missing context, invalid state)

## Integration Patterns

### Request Flow
1. **Route Entry**: `POST /conversational-turn` receives request
2. **Client Resolution**: `client-resolver.js` validates and loads client context
3. **Meeting Management**: `meeting-manager.js` ensures proper meeting association
4. **Turn Processing**: `turn-orchestrator.js` handles main conversation logic
5. **Error Handling**: `error-handler.js` manages any failures throughout the flow

### DatabaseAgent Integration
All modules use DatabaseAgent for data operations:
- `turnOperations.createTurn()` - Store conversation turns
- `clientOperations.getClientById()` - Validate client access
- `meetingOperations.createMeeting()` - Create session meetings
- `userOperations.getUserById()` - Validate user context

### LLM Provider Integration
- Dynamic LLM selection based on client preferences
- Provider-specific error handling and retry logic
- Response streaming and formatting
- Usage tracking and rate limiting

## Data Flow Patterns

### Conversation Context Building
```javascript
{
  user: { user_id, name, email },
  client: { client_id, name, settings },
  meeting: { meeting_id, type, metadata },
  conversation_history: [previous_turns],
  file_context: [relevant_chunks]
}
```

### Turn Data Structure
```javascript
{
  content_text: string,
  role: 'user' | 'assistant',
  user_id: number,
  client_id: number, 
  meeting_id: string,
  metadata: {
    llm_used: string,
    response_time: number,
    token_count: number
  }
}
```

## Error Handling Patterns

### Recoverable Errors
- LLM rate limiting → Retry with backoff
- Temporary database connection issues → Retry operation
- Invalid client context → Re-validate and retry

### Non-Recoverable Errors  
- Authentication failures → Return 401 Unauthorized
- Client access denied → Return 403 Forbidden
- Malformed request data → Return 400 Bad Request

### Error Response Format
```javascript
{
  "error": true,
  "message": "Human readable error description",
  "code": "ERROR_CODE",
  "context": {
    "request_id": string,
    "timestamp": string
  }
}
```

## Security Patterns

### Access Control
- User authentication verification
- Client access permission validation
- Meeting ownership verification
- Resource access boundary enforcement

### Data Protection
- Turn content sanitization
- User context isolation
- Client data segregation
- Secure error reporting (no sensitive data leakage)

## Performance Considerations

### Conversation Context
- Efficient context building with limited history
- File context relevance scoring and limiting
- Streaming responses for large content

### Database Optimization
- Batch operations where possible
- Efficient query patterns via DatabaseAgent
- Connection pooling and transaction management

## Testing Strategies

### Unit Tests
- Individual handler function testing
- Mock dependencies (DatabaseAgent, LLM providers)
- Error handling coverage
- Context resolution validation

### Integration Tests
- Full conversation flow testing
- Client context resolution
- Meeting association verification
- Error handling across component boundaries
- LLM provider integration testing