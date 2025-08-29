# Avatar Operations

## Purpose
Specialized avatar management operations including client integration, CRUD operations, selection handling, and customization management. Provides comprehensive avatar system functionality within client boundaries.

## Core Operation Modules

### `avatar-client.js`
**Purpose**: Avatar-client integration and relationship management
- Manages avatar availability per client
- Enforces client-specific avatar policies and restrictions
- Handles avatar customization within client limits
- Provides client avatar configuration interface

```javascript
export class AvatarClientIntegration {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }
  
  async configureClientAvatars(clientId, avatarConfig, adminUserId) {
    // 1. Validate admin permissions for client avatar configuration
    // 2. Validate avatar configuration against system limits
    // 3. Update client avatar policies via DatabaseAgent
    // 4. Set avatar availability for client users
    // 5. Configure customization permissions and limits
    // 6. Log avatar configuration changes
    // 7. Return updated client avatar configuration
  }
  
  async getClientAvatarPolicies(clientId) {
    // 1. Query client avatar configuration via DatabaseAgent
    // 2. Load avatar availability restrictions
    // 3. Get customization permission levels
    // 4. Include avatar feature flags and limits
    // 5. Return comprehensive avatar policy object
  }
  
  async addAvatarToClient(clientId, avatarId, permissions, adminUserId) {
    // 1. Validate admin permissions for avatar management
    // 2. Check avatar compatibility with client
    // 3. Create avatar-client relationship via DatabaseAgent
    // 4. Set avatar permissions and availability
    // 5. Log avatar addition to client
    // 6. Return updated avatar availability
  }
  
  async removeAvatarFromClient(clientId, avatarId, adminUserId) {
    // 1. Validate admin permissions
    // 2. Check for existing user selections of this avatar
    // 3. Handle user avatar reassignment if needed
    // 4. Remove avatar-client relationship via DatabaseAgent
    // 5. Log avatar removal from client
  }
}
```

### `avatar-crud.js`
**Purpose**: Avatar data management and CRUD operations
- Creates, reads, updates, and deletes avatar records
- Manages avatar metadata and configuration
- Handles avatar versioning and updates
- Provides avatar data validation and integrity

```javascript
export class AvatarCRUD {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }
  
  async createAvatar(avatarData, creatorUserId) {
    // 1. Validate avatar data structure and required fields
    // 2. Check creator permissions for avatar creation
    // 3. Validate avatar configuration options
    // 4. Store avatar record via DatabaseAgent
    // 5. Initialize avatar availability settings
    // 6. Set up default customization options
    // 7. Log avatar creation event
    // 8. Return created avatar with generated ID
  }
  
  async updateAvatar(avatarId, updates, userId) {
    // 1. Validate user permissions to modify avatar
    // 2. Validate update data and configuration changes
    // 3. Check impact on existing user selections
    // 4. Update avatar record via DatabaseAgent
    // 5. Handle avatar version tracking
    // 6. Update dependent configurations
    // 7. Log avatar modification
    // 8. Return updated avatar data
  }
  
  async getAvatarById(avatarId, includeConfig = false) {
    // 1. Query avatar record via DatabaseAgent
    // 2. Include configuration data if requested
    // 3. Load availability and permission settings
    // 4. Format avatar data for response
    // 5. Return avatar object or null if not found
  }
  
  async deleteAvatar(avatarId, userId) {
    // 1. Validate user permissions for avatar deletion
    // 2. Check for dependencies (user selections, client assignments)
    // 3. Handle dependent data cleanup or reassignment
    // 4. Remove avatar record via DatabaseAgent
    // 5. Clean up related configuration data
    // 6. Log avatar deletion event
    // 7. Return deletion confirmation
  }
  
  async listAvatars(filters = {}) {
    // 1. Build query filters from parameters
    // 2. Query avatars via DatabaseAgent with pagination
    // 3. Apply permission-based filtering
    // 4. Include avatar metadata and status
    // 5. Return paginated avatar list
  }
}
```

### `avatar-selection.js`
**Purpose**: User avatar selection and customization management
- Handles user avatar selection validation and processing
- Manages avatar customization options and limits
- Provides avatar preview and configuration interface
- Tracks avatar selection history and preferences

```javascript
export class AvatarSelection {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }
  
  async selectUserAvatar(userId, clientId, avatarId, customizations = {}) {
    // 1. Validate user access to client and avatar
    // 2. Check avatar availability for client
    // 3. Validate customization options against limits
    // 4. Sanitize and validate customization data
    // 5. Update user avatar selection via DatabaseAgent
    // 6. Apply customizations within client restrictions
    // 7. Update active session configurations
    // 8. Log avatar selection change
    // 9. Return updated avatar configuration
  }
  
  async getUserAvatar(userId, clientId) {
    // 1. Query user's current avatar selection via DatabaseAgent
    // 2. Load avatar configuration and customizations
    // 3. Include avatar capabilities and settings
    // 4. Format avatar data for application use
    // 5. Return complete avatar configuration
  }
  
  async getAvailableAvatars(userId, clientId) {
    // 1. Query avatars available to client via DatabaseAgent
    // 2. Filter by user permission level
    // 3. Include avatar metadata and capabilities
    // 4. Mark user's current selection
    // 5. Return formatted avatar catalog
  }
  
  async updateAvatarCustomizations(userId, clientId, customizations) {
    // 1. Validate user owns avatar selection
    // 2. Check customization permissions for client
    // 3. Validate customization options and values
    // 4. Apply client-specific customization limits
    // 5. Update customizations via DatabaseAgent
    // 6. Update active session configuration
    // 7. Log customization changes
    // 8. Return updated avatar configuration
  }
  
  async previewAvatarConfiguration(userId, clientId, avatarId, customizations) {
    // 1. Validate user access to avatar
    // 2. Apply customizations to avatar base configuration
    // 3. Generate preview configuration
    // 4. Include customization validation results
    // 5. Return preview data for UI display
  }
  
  async resetAvatarToDefault(userId, clientId) {
    // 1. Get client's default avatar configuration
    // 2. Reset user avatar selection to default
    // 3. Clear custom customizations
    // 4. Update via DatabaseAgent
    // 5. Log avatar reset action
    // 6. Return default avatar configuration
  }
}
```

### `index.js`
**Purpose**: Avatar operations module coordination and unified interface
- Exports all avatar operation classes
- Provides unified avatar operations manager
- Coordinates dependencies between avatar operation modules
- Manages avatar operation initialization and lifecycle

```javascript
import { AvatarClientIntegration } from './avatar-client.js';
import { AvatarCRUD } from './avatar-crud.js';
import { AvatarSelection } from './avatar-selection.js';

export { AvatarClientIntegration, AvatarCRUD, AvatarSelection };

export class AvatarOperationsManager {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
    this.clientIntegration = new AvatarClientIntegration(dbAgent);
    this.crud = new AvatarCRUD(dbAgent);
    this.selection = new AvatarSelection(dbAgent);
  }
  
  // Unified interface methods that coordinate multiple operations
  
  async setupClientAvatarSystem(clientId, config, adminUserId) {
    // 1. Create client-specific avatars if needed
    // 2. Configure client avatar policies
    // 3. Set up default avatar selections
    // 4. Initialize avatar customization settings
    // 5. Return complete avatar system setup
    
    const avatars = await this.crud.listAvatars({ available: true });
    const clientConfig = await this.clientIntegration.configureClientAvatars(
      clientId, 
      config, 
      adminUserId
    );
    
    return {
      availableAvatars: avatars,
      clientConfiguration: clientConfig
    };
  }
  
  async handleUserAvatarChange(userId, clientId, avatarId, customizations) {
    // 1. Validate and process avatar selection
    // 2. Apply customizations
    // 3. Update all related configurations
    // 4. Return complete avatar setup
    
    return await this.selection.selectUserAvatar(
      userId, 
      clientId, 
      avatarId, 
      customizations
    );
  }
  
  async getCompleteAvatarContext(userId, clientId) {
    // 1. Get user's current avatar
    // 2. Get available avatars for client
    // 3. Get client avatar policies
    // 4. Return complete avatar context
    
    const [currentAvatar, availableAvatars, policies] = await Promise.all([
      this.selection.getUserAvatar(userId, clientId),
      this.selection.getAvailableAvatars(userId, clientId),
      this.clientIntegration.getClientAvatarPolicies(clientId)
    ]);
    
    return {
      current: currentAvatar,
      available: availableAvatars,
      policies: policies
    };
  }
}
```

## Avatar Data Models

### Avatar Record Structure
```javascript
{
  id: number,
  name: string,
  display_name: string,
  description: string,
  type: 'system' | 'client_custom' | 'user_custom',
  creator_user_id: number,
  configuration: {
    personality: {
      traits: [string],
      communication_style: string,
      expertise_domains: [string]
    },
    capabilities: {
      conversation_modes: [string],
      specialized_functions: [string],
      language_support: [string]
    },
    appearance: {
      visual_style: string,
      color_scheme: object,
      icon_set: string
    }
  },
  customization_options: {
    allowed_modifications: [string],
    customization_limits: object,
    preset_variants: [object]
  },
  metadata: {
    version: string,
    created_at: Date,
    updated_at: Date,
    tags: [string],
    category: string
  }
}
```

### User Avatar Selection Structure
```javascript
{
  user_id: number,
  client_id: number,
  avatar_id: number,
  customizations: {
    personality_adjustments: object,
    appearance_modifications: object,
    behavior_preferences: object,
    response_style_overrides: object
  },
  selection_metadata: {
    selected_at: Date,
    customized_at: Date,
    selection_source: 'manual' | 'default' | 'recommended'
  }
}
```

### Client Avatar Policy Structure
```javascript
{
  client_id: number,
  avatar_policies: {
    available_avatars: [number],
    default_avatar_id: number,
    customization_permissions: {
      personality_modification: boolean,
      appearance_modification: boolean,
      behavior_modification: boolean,
      custom_avatar_creation: boolean
    },
    customization_limits: {
      max_personality_variance: number,
      allowed_appearance_changes: [string],
      restricted_behaviors: [string]
    }
  },
  policy_metadata: {
    created_at: Date,
    updated_at: Date,
    updated_by_user_id: number
  }
}
```

## Database Integration Patterns

### Avatar Operations (via DatabaseAgent)
- `avatarOperations.createAvatar(avatarData)` - Create avatar record
- `avatarOperations.updateAvatar(avatarId, updates)` - Modify avatar
- `avatarOperations.deleteAvatar(avatarId)` - Remove avatar
- `avatarOperations.getAvatarsByClient(clientId)` - Get client avatars

### User Avatar Operations (via DatabaseAgent)
- `userAvatarOperations.setUserAvatar(userId, clientId, avatarId)` - Set selection
- `userAvatarOperations.getUserAvatar(userId, clientId)` - Get user's avatar
- `userAvatarOperations.updateCustomizations(userId, clientId, customizations)` - Update custom settings

### Client Avatar Configuration (via DatabaseAgent)
- `clientAvatarOperations.setClientAvatarPolicy(clientId, policy)` - Set policies
- `clientAvatarOperations.getClientAvatarPolicy(clientId)` - Get policies
- `clientAvatarOperations.addAvatarToClient(clientId, avatarId)` - Make avatar available

## Validation and Security

### Avatar Data Validation
```javascript
export class AvatarValidator {
  validateAvatarData(avatarData) {
    const errors = [];
    
    // Required fields validation
    if (!avatarData.name || avatarData.name.trim().length === 0) {
      errors.push('Avatar name is required');
    }
    
    // Configuration validation
    if (avatarData.configuration) {
      this.validateAvatarConfiguration(avatarData.configuration, errors);
    }
    
    // Customization options validation
    if (avatarData.customization_options) {
      this.validateCustomizationOptions(avatarData.customization_options, errors);
    }
    
    return errors;
  }
  
  validateAvatarCustomizations(customizations, avatarConfig, clientPolicy) {
    // 1. Check customizations against avatar's allowed modifications
    // 2. Validate against client policy restrictions
    // 3. Ensure customization values are within acceptable ranges
    // 4. Return validation results with specific error messages
  }
}
```

### Permission Validation
```javascript
export class AvatarPermissionValidator {
  async validateAvatarAccess(userId, clientId, avatarId, operation) {
    // 1. Check user has access to client
    // 2. Verify avatar is available for client
    // 3. Check user permission level for operation
    // 4. Validate operation-specific requirements
    // 5. Return permission validation result
  }
  
  async validateCustomizationPermissions(userId, clientId, customizations) {
    // 1. Get client avatar customization policies
    // 2. Check user's permission level
    // 3. Validate each customization against policy
    // 4. Return list of allowed/denied customizations
  }
}
```

## Error Handling

### Avatar Operation Errors
```javascript
export class AvatarOperationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AvatarOperationError';
    this.code = code;
    this.details = details;
  }
}

export function handleAvatarError(error, operation, context) {
  console.error(`Avatar operation failed: ${operation}`, {
    error: error.message,
    code: error.code,
    context: context
  });
  
  // Log error for monitoring
  // Return appropriate error response
  // Handle recovery if possible
}
```

## Testing Strategies

### Unit Testing
- Test avatar CRUD operations with various data scenarios
- Validate avatar customization logic and limits
- Test client integration and policy enforcement
- Mock DatabaseAgent for consistent test results

### Integration Testing
- Test complete avatar selection workflows
- Validate cross-module coordination (CRUD + Selection + Client)
- Test avatar system setup for new clients
- Verify avatar data consistency across operations

### Permission Testing
- Test avatar access control boundaries
- Validate customization permission enforcement
- Test client policy application
- Verify admin operation authorization

### Error Handling Testing
- Test invalid avatar data handling
- Validate error recovery scenarios
- Test database failure handling
- Verify proper error logging and reporting