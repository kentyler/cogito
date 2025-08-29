# Client Management System

## Purpose
Client-specific operations, avatar system management, and client configuration handling. Provides multi-tenant client support with customizable settings, avatar systems, and administrative operations.

## Core Client Components

### `admin-client-operations.js`
**Purpose**: Administrative client management operations
- Client creation, modification, and deletion
- Client configuration management
- User-client relationship administration
- Client permissions and access control

```javascript
export class AdminClientOperations {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }
  
  async createClient(adminUserId, clientData) {
    // 1. Validate admin permissions for client creation
    // 2. Validate client data and configuration
    // 3. Create client record via DatabaseAgent
    // 4. Set up default client configurations
    // 5. Create initial admin user-client relationship
    // 6. Initialize client-specific resources
    // 7. Log client creation event
    // 8. Return created client with initial setup
  }
  
  async updateClientConfiguration(clientId, config, adminUserId) {
    // 1. Validate admin has permission to modify client
    // 2. Validate configuration changes
    // 3. Update client settings via DatabaseAgent
    // 4. Apply configuration changes to active sessions
    // 5. Log configuration changes for audit
    // 6. Return updated client configuration
  }
  
  async manageClientUsers(clientId, operations, adminUserId) {
    // 1. Validate admin permissions
    // 2. Process user addition/removal operations
    // 3. Update user-client relationships
    // 4. Handle permission changes
    // 5. Notify affected users of changes
    // 6. Log user management actions
  }
}
```

### `avatar-system.js`
**Purpose**: Avatar system coordination and management
- Avatar configuration and customization
- Avatar behavior and response styling
- Avatar-client integration management
- Avatar availability and permissions

```javascript
export class AvatarSystem {
  constructor(dbAgent, avatarOperations) {
    this.dbAgent = dbAgent;
    this.avatarOperations = avatarOperations;
  }
  
  async initializeClientAvatars(clientId) {
    // 1. Load client-specific avatar configurations
    // 2. Initialize available avatars for client
    // 3. Set up default avatar selections
    // 4. Configure avatar customization options
    // 5. Return client avatar system configuration
  }
  
  async updateUserAvatar(userId, clientId, avatarSelection) {
    // 1. Validate avatar availability for client
    // 2. Check user permissions for avatar selection
    // 3. Update user avatar preference via DatabaseAgent
    // 4. Apply avatar configuration to active sessions
    // 5. Log avatar selection change
    // 6. Return updated avatar configuration
  }
  
  async getAvailableAvatars(clientId, userId) {
    // 1. Query available avatars for client
    // 2. Filter by user permissions and access levels
    // 3. Include avatar capabilities and customization options
    // 4. Return formatted avatar catalog
  }
}
```

### `client-temperature-loader.js`
**Purpose**: Client-specific temperature and LLM configuration loading
- Client LLM preferences and restrictions
- Temperature limits and default settings
- Model availability per client
- Configuration inheritance and overrides

```javascript
export class ClientTemperatureLoader {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }
  
  async loadClientTemperatureSettings(clientId) {
    // 1. Query client-specific temperature configurations
    // 2. Load temperature limits and restrictions
    // 3. Get default temperature preferences
    // 4. Apply client policy overrides
    // 5. Return temperature configuration object
  }
  
  async getUserEffectiveTemperature(userId, clientId) {
    // 1. Get user's temperature preference
    // 2. Load client temperature limits
    // 3. Apply client restrictions and policies
    // 4. Calculate effective temperature within limits
    // 5. Return validated temperature setting
  }
  
  async updateClientTemperatureLimits(clientId, limits, adminUserId) {
    // 1. Validate admin permissions
    // 2. Validate temperature limit ranges
    // 3. Update client temperature configuration
    // 4. Apply limits to existing user settings
    // 5. Log configuration changes
  }
}
```

### `avatar-operations/` Subdirectory

#### `avatar-client.js`
**Purpose**: Client-specific avatar integration and management
- Avatar-client relationship management
- Client avatar policies and restrictions
- Avatar customization within client boundaries
- Client-specific avatar features

```javascript
export class AvatarClientIntegration {
  async configureClientAvatars(clientId, avatarConfig) {
    // 1. Validate avatar configuration for client
    // 2. Set up client-specific avatar policies
    // 3. Configure avatar customization limits
    // 4. Initialize avatar-client relationships
    // 5. Return client avatar configuration
  }
  
  async getClientAvatarPolicies(clientId) {
    // 1. Query client avatar policies via DatabaseAgent
    // 2. Include customization permissions and limits
    // 3. Get avatar availability restrictions
    // 4. Return client avatar policy object
  }
}
```

#### `avatar-crud.js`
**Purpose**: Avatar CRUD operations and data management
- Avatar creation, reading, updating, deletion
- Avatar metadata and configuration management
- Avatar version control and updates
- Avatar data validation and integrity

```javascript
export class AvatarCRUD {
  async createAvatar(avatarData, clientId) {
    // 1. Validate avatar data and configuration
    // 2. Check client permissions for avatar creation
    // 3. Store avatar data via DatabaseAgent
    // 4. Initialize avatar configuration
    // 5. Set up avatar availability
    // 6. Return created avatar with metadata
  }
  
  async updateAvatar(avatarId, updates, userId) {
    // 1. Validate user permissions for avatar modification
    // 2. Validate update data
    // 3. Update avatar via DatabaseAgent
    // 4. Handle avatar version control
    // 5. Update dependent configurations
    // 6. Log avatar modification
  }
  
  async deleteAvatar(avatarId, userId) {
    // 1. Validate deletion permissions
    // 2. Check avatar usage dependencies
    // 3. Handle user avatar reassignment
    // 4. Delete avatar data via DatabaseAgent
    // 5. Clean up related configurations
    // 6. Log avatar deletion
  }
}
```

#### `avatar-selection.js`
**Purpose**: User avatar selection and customization interface
- Avatar selection validation and processing
- Avatar customization options management
- User avatar preference tracking
- Avatar selection conflict resolution

```javascript
export class AvatarSelection {
  async selectUserAvatar(userId, clientId, avatarId, customizations = {}) {
    // 1. Validate avatar availability for user and client
    // 2. Check customization permissions
    // 3. Validate customization options
    // 4. Update user avatar selection via DatabaseAgent
    // 5. Apply customizations within client limits
    // 6. Update active session configurations
    // 7. Log avatar selection
    // 8. Return updated avatar configuration
  }
  
  async getAvailableCustomizations(avatarId, clientId) {
    // 1. Query avatar customization options
    // 2. Apply client-specific restrictions
    // 3. Filter by user permission levels
    // 4. Return available customization options
  }
  
  async previewAvatarCustomization(avatarId, customizations) {
    // 1. Validate customization parameters
    // 2. Generate preview configuration
    // 3. Return preview data for UI display
  }
}
```

#### `index.js`
**Purpose**: Avatar operations module coordination and exports
- Exports all avatar operation classes
- Provides unified avatar operations interface
- Coordinates avatar operation dependencies
- Manages avatar operation initialization

```javascript
export { AvatarClientIntegration } from './avatar-client.js';
export { AvatarCRUD } from './avatar-crud.js';
export { AvatarSelection } from './avatar-selection.js';

export class AvatarOperationsManager {
  constructor(dbAgent) {
    this.clientIntegration = new AvatarClientIntegration(dbAgent);
    this.crud = new AvatarCRUD(dbAgent);
    this.selection = new AvatarSelection(dbAgent);
  }
  
  // Unified interface for all avatar operations
}
```

## Client Configuration Models

### Client Structure
```javascript
{
  id: number,
  name: string,
  description: string,
  settings: {
    llm_restrictions: {
      allowed_models: [number],
      temperature_limits: {
        min: number,
        max: number,
        default: number
      }
    },
    avatar_policies: {
      customization_allowed: boolean,
      available_avatars: [number],
      custom_avatars_allowed: boolean
    },
    feature_flags: {
      advanced_features: boolean,
      beta_features: boolean
    }
  },
  created_at: Date,
  updated_at: Date,
  created_by_user_id: number
}
```

### Avatar Configuration
```javascript
{
  id: number,
  name: string,
  type: 'default' | 'custom' | 'client_specific',
  client_id: number,
  configuration: {
    personality_traits: [string],
    response_style: string,
    expertise_areas: [string],
    communication_preferences: object
  },
  customization_options: {
    voice_settings: object,
    visual_settings: object,
    behavioral_settings: object
  },
  availability: {
    is_active: boolean,
    client_restrictions: [number],
    permission_level: 'basic' | 'premium' | 'admin'
  }
}
```

## Database Integration

### Client Operations (via DatabaseAgent)
- `clientOperations.createClient(clientData)` - Create new client
- `clientOperations.updateClientSettings(clientId, settings)` - Update configuration
- `clientOperations.getClientById(clientId)` - Get client details
- `clientOperations.deleteClient(clientId)` - Remove client

### Avatar Operations (via DatabaseAgent)
- `avatarOperations.createAvatar(avatarData)` - Create avatar
- `avatarOperations.getUserAvatar(userId, clientId)` - Get user's avatar
- `avatarOperations.updateAvatarSelection(userId, avatarId)` - Update selection
- `avatarOperations.getAvailableAvatars(clientId)` - Get client avatars

### Client Settings Operations (via DatabaseAgent)
- `clientSettingsOperations.getTemperatureLimits(clientId)` - Get temperature config
- `clientSettingsOperations.updateLLMRestrictions(clientId, restrictions)` - Update LLM limits
- `clientSettingsOperations.getFeatureFlags(clientId)` - Get enabled features

## Multi-Tenancy Patterns

### Client Isolation
```javascript
export class ClientIsolationManager {
  validateClientAccess(userId, clientId) {
    // 1. Verify user has access to specified client
    // 2. Check access level and permissions
    // 3. Validate client is active and available
    // 4. Return access validation result
  }
  
  enforceClientBoundaries(operation, clientId, targetResource) {
    // 1. Ensure operation respects client boundaries
    // 2. Validate resource belongs to client
    // 3. Apply client-specific restrictions
    // 4. Prevent cross-client data access
  }
}
```

### Configuration Inheritance
```javascript
export class ClientConfigurationManager {
  getEffectiveConfiguration(userId, clientId, configType) {
    // 1. Load base system configuration
    // 2. Apply client-specific overrides
    // 3. Apply user-specific preferences within limits
    // 4. Return effective configuration
  }
  
  validateConfigurationChange(clientId, configKey, newValue, adminUserId) {
    // 1. Check admin has permission to modify configuration
    // 2. Validate configuration value against system limits
    // 3. Check impact on existing users
    // 4. Return validation result
  }
}
```

## Security and Access Control

### Administrative Permissions
```javascript
export class ClientAdminSecurity {
  validateAdminOperation(userId, clientId, operation) {
    // 1. Verify user has admin role for client
    // 2. Check specific operation permissions
    // 3. Validate operation is allowed for client type
    // 4. Log admin operation attempt
    // 5. Return permission validation result
  }
  
  auditAdminAction(adminUserId, clientId, action, details) {
    // 1. Log admin action with full context
    // 2. Include before/after states for changes
    // 3. Store audit trail for compliance
    // 4. Alert on sensitive administrative actions
  }
}
```

### Avatar Security
```javascript
export class AvatarSecurityManager {
  validateAvatarAccess(userId, clientId, avatarId) {
    // 1. Check user has access to client
    // 2. Verify avatar is available for client
    // 3. Check user permission level for avatar
    // 4. Validate avatar customization permissions
  }
  
  sanitizeAvatarCustomizations(customizations, clientLimits) {
    // 1. Remove disallowed customization options
    // 2. Validate customization values against limits
    // 3. Sanitize user input for security
    // 4. Return safe customization object
  }
}
```

## Performance Optimization

### Configuration Caching
```javascript
export class ClientConfigCache {
  constructor(ttl = 300000) { // 5 minutes
    this.configCache = new Map();
    this.ttl = ttl;
  }
  
  async getCachedConfig(clientId, configType) {
    const cacheKey = `${clientId}:${configType}`;
    const cached = this.configCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    // Cache miss - load from database
    const config = await this.loadConfigFromDatabase(clientId, configType);
    this.configCache.set(cacheKey, {
      data: config,
      timestamp: Date.now()
    });
    
    return config;
  }
  
  invalidateClientCache(clientId) {
    // Remove all cached configurations for client
    for (const [key, value] of this.configCache) {
      if (key.startsWith(`${clientId}:`)) {
        this.configCache.delete(key);
      }
    }
  }
}
```

## Testing Strategies

### Client Management Testing
- Test client creation with various configurations
- Validate client isolation and data boundaries
- Test administrative operations and permissions
- Verify configuration inheritance and overrides

### Avatar System Testing
- Test avatar CRUD operations with different clients
- Validate avatar selection and customization
- Test avatar permission boundaries
- Verify avatar configuration persistence

### Multi-Tenancy Testing
- Test client isolation across all operations
- Validate cross-client data access prevention
- Test configuration inheritance scenarios
- Verify client-specific feature restrictions

### Security Testing
- Test administrative permission boundaries
- Validate avatar access control
- Test configuration change auditing
- Verify client data isolation security