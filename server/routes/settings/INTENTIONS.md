# Settings Routes

## Purpose
HTTP endpoints for user settings management, preferences configuration, and system settings. Handles user preferences, LLM configuration, avatar management, and personalization options.

## Core Route Files

### `index.js`
**Purpose**: Main settings router and route coordination
- Aggregates all settings-related routes
- Provides unified settings management interface
- Coordinates preference updates and retrieval
- Handles route middleware and authentication

```javascript
// Main settings routes
router.use('/user', userPreferencesRoutes);
router.use('/llm', llmConfigurationRoutes);
router.use('/avatars', avatarManagementRoutes);
router.use('/temperature', temperatureSettingsRoutes);
```

### `llms.js`
**Purpose**: LLM (Language Model) configuration and preferences
- GET `/llms/available` - List available LLM models
- GET `/llms/current` - Get user's current LLM preference
- POST `/llms/select` - Update user's LLM selection
- GET `/llms/capabilities` - Get LLM model capabilities and limits

```javascript
router.get('/llms/available', async (req, res) => {
  // 1. Validate user authentication and client context
  // 2. Fetch available LLMs for user's client via DatabaseAgent
  // 3. Filter LLMs based on permissions and availability
  // 4. Return formatted LLM list with capabilities
});

router.post('/llms/select', handleLLMPreferenceUpdate);
// Delegates to handlers/llm-preferences.js
```

### `avatars.js`
**Purpose**: Avatar system management and customization
- GET `/avatars/available` - List available avatar options
- GET `/avatars/current` - Get user's current avatar configuration
- POST `/avatars/select` - Update user's avatar selection
- POST `/avatars/customize` - Customize avatar properties

```javascript
router.get('/avatars/available', async (req, res) => {
  // 1. Validate authentication and client permissions
  // 2. Fetch available avatars via DatabaseAgent
  // 3. Include avatar metadata and customization options
  // 4. Return avatar catalog with user's current selection
});
```

### `temperature-settings.js`
**Purpose**: AI temperature and response behavior configuration
- GET `/temperature/current` - Get current temperature settings
- POST `/temperature/update` - Update temperature preferences
- GET `/temperature/presets` - Get predefined temperature presets
- POST `/temperature/custom` - Create custom temperature configuration

```javascript
router.post('/temperature/update', async (req, res) => {
  // 1. Validate temperature value range (0.0 - 2.0)
  // 2. Update user's temperature preference via DatabaseAgent
  // 3. Validate against client-specific limits
  // 4. Return updated temperature configuration
});
```

### `handlers/` Subdirectory
Contains focused handler modules (documented in separate INTENTIONS.md):
- `llm-preferences.js` - LLM selection and validation
- `user-preferences.js` - General user preference management
- `llm-list.js` - Available LLM model listing

## Settings Data Models

### User Preferences Structure
```javascript
{
  user_id: number,
  preferences: {
    selected_llm_id: number,
    avatar_id: number,
    temperature: number,
    ui_theme: 'light' | 'dark' | 'auto',
    notifications: {
      email: boolean,
      browser: boolean,
      summary: boolean
    },
    conversation: {
      auto_title: boolean,
      streaming: boolean,
      context_length: number
    }
  },
  client_settings: {
    // Client-specific overrides
    allowed_models: [number],
    temperature_limits: {
      min: number,
      max: number
    }
  }
}
```

### LLM Configuration
```javascript
{
  id: number,
  name: string,
  model: string,
  provider: 'anthropic' | 'openai' | 'local',
  capabilities: [string],
  limits: {
    max_tokens: number,
    context_window: number,
    temperature_range: {
      min: number,
      max: number
    }
  },
  availability: {
    is_active: boolean,
    client_restrictions: [number]
  }
}
```

### Avatar Configuration
```javascript
{
  avatar_id: number,
  name: string,
  type: 'default' | 'custom' | 'generated',
  properties: {
    style: string,
    color_scheme: string,
    personality_traits: [string]
  },
  customization: {
    voice: string,
    response_style: string,
    expertise_areas: [string]
  }
}
```

## Database Integration

### User Preference Operations (via DatabaseAgent)
- `userOperations.getUserPreferences(userId)` - Get all user preferences
- `userOperations.updatePreferences(userId, preferences)` - Update preferences
- `userOperations.updateLLMPreference(userId, llmId)` - Update LLM selection
- `userOperations.updateAvatarSelection(userId, avatarId)` - Update avatar

### LLM Operations (via DatabaseAgent)
- `llmOperations.getAvailableLLMs(clientId)` - Get client-accessible models
- `llmOperations.getLLMById(llmId)` - Get specific model details
- `llmOperations.validateLLMAccess(userId, clientId, llmId)` - Validate access

### Client Settings Operations (via DatabaseAgent)
- `clientSettingsOperations.getClientSettings(clientId)` - Get client settings
- `clientSettingsOperations.getLLMRestrictions(clientId)` - Get model restrictions
- `clientSettingsOperations.getTemperatureLimits(clientId)` - Get temperature limits

## Request/Response Patterns

### Get User Preferences
```javascript
GET /settings/user-preferences

// Response
{
  "preferences": {
    "selected_llm_id": number,
    "avatar_id": number,
    "temperature": number,
    "ui_theme": string,
    "notifications": object,
    "conversation": object
  },
  "client_restrictions": {
    "allowed_models": [number],
    "temperature_limits": object
  }
}
```

### Update LLM Preference
```javascript
POST /settings/llms/select
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

### Temperature Settings Update
```javascript
POST /settings/temperature/update
{
  "temperature": 0.7,
  "preset": "balanced"
}

// Response
{
  "success": true,
  "temperature": 0.7,
  "preset": "balanced",
  "limits": {
    "min": 0.0,
    "max": 1.0
  }
}
```

### Available LLMs List
```javascript
GET /settings/llms/available

// Response
{
  "llms": [
    {
      "id": number,
      "name": string,
      "model": string,
      "capabilities": [string],
      "is_current": boolean,
      "limits": object
    }
  ],
  "current_selection": {
    "id": number,
    "name": string
  }
}
```

## Validation Patterns

### LLM Validation
- Model exists and is active
- User has access to selected model
- Client permissions allow model usage
- Model capabilities meet requirements

### Temperature Validation
- Value within valid range (0.0 - 2.0)
- Respects client-specific limits
- Compatible with selected LLM model
- Reasonable for conversation context

### Avatar Validation
- Avatar exists and is available
- User has access to avatar type
- Customization options are valid
- Client permissions allow avatar usage

## Security Patterns

### Preference Security
- User authentication verification
- Client context validation
- Permission boundary enforcement
- Setting isolation between users

### Model Access Control
- LLM availability verification
- Client-based model restrictions
- Usage permission validation
- Rate limiting considerations

### Data Protection
- Preference data encryption
- Secure preference transmission
- Audit logging for setting changes
- Privacy-conscious data handling

## Error Handling

### Validation Errors
- Invalid LLM ID → 400 Bad Request with available options
- Temperature out of range → 400 Bad Request with valid range
- Invalid avatar selection → 400 Bad Request with available avatars
- Malformed preference data → 400 Bad Request with validation details

### Permission Errors
- LLM access denied → 403 Forbidden with explanation
- Client restrictions violated → 403 Forbidden with limits
- Setting not available → 403 Forbidden with alternatives

### Authentication Errors
- Unauthenticated requests → 401 Unauthorized
- Session expired → 401 Unauthorized with redirect
- Missing client context → 400 Bad Request

### Database Errors
- Preference update failures → 500 Internal Server Error
- Model query failures → 500 Internal Server Error
- Setting retrieval errors → 500 Internal Server Error

## Integration Points

### Conversation System
- LLM selection affects conversation responses
- Temperature settings influence AI behavior
- Avatar configuration affects response style
- Settings apply to active conversation sessions

### Client Management
- Client-specific setting restrictions
- Client permission validation
- Multi-client setting isolation
- Client-based feature availability

### Avatar System
- Avatar selection and customization
- Avatar behavior configuration
- Avatar response personalization
- Avatar-conversation integration

## Performance Considerations

### Settings Caching
- Cache frequently accessed preferences
- Efficient preference retrieval
- Minimize database queries
- Session-based preference storage

### Validation Efficiency
- Cached model availability data
- Efficient permission checking
- Optimized client restriction queries
- Fast validation response times

## Testing Strategies

### Preference Testing
- Setting update and retrieval testing
- Validation boundary testing
- Permission enforcement testing
- Error condition handling

### Security Testing
- Access control validation
- Cross-user preference isolation
- Permission boundary testing
- Authentication requirement verification

### Integration Testing
- Conversation system integration
- Client restriction enforcement
- Avatar system coordination
- Multi-client setting isolation

### Performance Testing
- Preference retrieval speed
- Update operation efficiency
- Concurrent access handling
- Cache effectiveness validation