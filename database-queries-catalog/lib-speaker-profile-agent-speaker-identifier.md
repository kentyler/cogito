# lib/speaker-profile-agent/speaker-identifier.js - Query Catalog

## File Summary
- **Purpose**: Speaker identification and user mapping with alias management
- **Query Count**: 3 queries
- **Main Operations**: Identify speakers by alias, get user info, create alias mappings

## Query Analysis

### Query 1: Identify Speaker by Alias (Line 33)
```javascript
const query = `
  SELECT u.id as user_id, u.email, u.metadata, ua.alias, ua.context
  FROM client_mgmt.user_alias ua
  JOIN client_mgmt.users u ON ua.user_id = u.id
  WHERE ua.context = $1 AND ua.alias = $2
`;
```
**Context**: `identifySpeaker` method  
**Purpose**: Find user by speaker name alias in specific context  
**Parameters**: `context`, `speakerName`  
**Returns**: User record with alias info

### Query 2: Get User Info by ID (Line 60)
```javascript
const query = `
  SELECT u.id as user_id, u.email, u.metadata,
         ua.alias, ua.context
  FROM client_mgmt.users u
  LEFT JOIN client_mgmt.user_alias ua ON u.id = ua.user_id AND ua.context = $1
  WHERE u.id = $2
`;
```
**Context**: `getUserInfo` method  
**Purpose**: Get complete user info including context-specific alias  
**Parameters**: `context`, `userId`  
**Returns**: User record with context alias (if exists)

### Query 3: Create Alias Mapping (Line 104)
```javascript
const query = `
  INSERT INTO client_mgmt.user_alias (user_id, context, alias, metadata, created_at)
  VALUES ($1, $2, $3, $4, NOW())
  ON CONFLICT (context, alias) DO NOTHING
  RETURNING alias_id
`;
```
**Context**: `createAlias` method  
**Purpose**: Create new speaker name → user mapping with conflict prevention  
**Parameters**: `userId`, `context`, `speakerName`, `metadata`  
**Returns**: New alias ID (if created)

## Proposed DatabaseAgent Methods

```javascript
// Speaker identification operations
async identifySpeakerByAlias(context, speakerName)
async getUserWithContextAlias(userId, context)
async createUserAlias(userId, context, alias, metadata = {})
```

## Domain Classification
- **Primary**: Speaker Identification
- **Secondary**: User Alias Management
- **Pattern**: Context-aware identity mapping with session caching

## Notes
- Session-level caching for performance (`sessionSpeakerCache`)
- Context-aware identification (different aliases per context/meeting)
- Conflict resolution with `ON CONFLICT DO NOTHING`
- Extensible handler system for unknown speakers
- Automatic metadata tagging with `source: 'speaker_profile_agent'`
- Memory management with cache clearing capabilities
- Supports multiple resolution strategies through registered handlers