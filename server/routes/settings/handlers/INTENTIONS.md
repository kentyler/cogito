# Settings Handlers

## Purpose
Focused handler modules for user settings management including LLM preferences, user data, and configuration options.

## Core Handlers

### `llm-preferences.js`
**Purpose**: Updates user's LLM model selection and preferences
- Validates LLM model availability and compatibility
- Updates user's preferred LLM via DatabaseAgent
- Handles LLM-specific configuration options

```javascript
export async function handleLLMPreferenceUpdate(req, res) {
  // 1. Extract llm_id from request body
  // 2. Validate user authentication (userId from session)
  // 3. Validate LLM exists and is available via isValidLLM()
  // 4. Update user's LLM preference via updateUserSelectedLLM()
  // 5. Return success response with updated preferences
}
```

**Validation**:
- LLM model exists and is active
- User has permission to use selected LLM
- Model compatibility with user's client settings

### `user-preferences.js`
**Purpose**: Retrieves user's current preferences and settings
- Fetches comprehensive user preference data
- Returns LLM preferences, UI settings, and personal configuration
- Provides data for settings form population

```javascript
export async function handleUserPreferences(req, res) {
  // 1. Validate user authentication
  // 2. Fetch user preferences via DatabaseAgent
  // 3. Include LLM settings, UI preferences, personal data
  // 4. Return formatted preference object
}
```

**Response Format**:
```javascript
{
  user: {
    name: string,
    email: string,
    preferences: {
      selected_llm_id: number,
      ui_theme: string,
      notifications: boolean
    }
  }
}
```

### `llm-list.js`
**Purpose**: Provides available LLM models for selection
- Returns list of active, available LLM models
- Includes model capabilities and configuration options
- Filters models based on user permissions and client access

```javascript
export async function handleLLMList(req, res) {
  // 1. Validate user authentication
  // 2. Fetch available LLMs via DatabaseAgent
  // 3. Filter based on user/client permissions
  // 4. Return formatted LLM list with capabilities
}
```

## Dependencies

### Core Dependencies
- `#server/conversations/llm-config.js` - LLM validation and configuration
- `#database/database-agent.js` - Database operations
- `#server/api/api-responses.js` - Standardized responses

### DatabaseAgent Operations
- `userOperations.getUserPreferences(userId)` - Get user settings
- `userOperations.updateLLMPreference(userId, llmId)` - Update LLM selection
- `llmOperations.getAvailableLLMs(clientId)` - Get accessible models

## Request/Response Patterns

### LLM Preference Update
```javascript
POST /settings/llm-preference
{
  "llm_id": number
}

// Response
{
  "success": true,
  "message": "LLM preference updated",
  "updated_llm": {
    "id": number,
    "name": string,
    "model": string
  }
}
```

### User Preferences Fetch
```javascript
GET /settings/user-preferences

// Response
{
  "user": {
    "name": string,
    "email": string,
    "preferences": {
      "selected_llm_id": number,
      "ui_settings": object
    }
  }
}
```

### LLM List Fetch
```javascript
GET /settings/llm-list

// Response
{
  "llms": [
    {
      "id": number,
      "name": string,
      "model": string,
      "capabilities": [string],
      "is_default": boolean
    }
  ]
}
```

## Error Handling

### Authentication Errors
- Missing session → 401 Unauthorized
- Invalid user_id → 401 Unauthorized

### Validation Errors
- Invalid LLM ID → 400 Bad Request with available options
- LLM not accessible to user → 403 Forbidden
- Malformed request data → 400 Bad Request

### Database Errors
- DatabaseAgent operation failures → 500 Internal Server Error
- Preference update conflicts → 409 Conflict

## Security Patterns

### Permission Validation
- Verify user can access requested LLM models
- Check client-level LLM restrictions
- Validate preference changes against user permissions

### Data Sanitization
- Validate all input parameters
- Sanitize user preference data before storage
- Prevent preference injection attacks

## Integration Points

### LLM Configuration System
- Integrates with `llm-config.js` for model validation
- Coordinates with conversation system for LLM usage
- Updates take effect immediately in new conversations

### User Interface
- Powers settings forms and preference displays
- Provides real-time LLM availability information
- Enables dynamic UI updates based on permissions

## Testing Strategies

### Unit Tests
- Test LLM validation with various model IDs
- Verify permission checking for different user types
- Test error handling for invalid requests
- Mock DatabaseAgent operations

### Integration Tests
- Test full preference update flow
- Verify LLM list filtering for different users
- Test settings persistence and retrieval
- Validate security boundaries and access controls