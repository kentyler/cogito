# server/routes/extension-api.js - Query Catalog

## File Summary
- **Purpose**: API endpoints for browser extension integration
- **Query Count**: 3 queries
- **Main Operations**: Get user clients, verify access, perform full-text search

## Query Analysis

### Query 1: Get User Clients (Line 12)
```javascript
const clientsResult = await req.db.query(
  `SELECT 
    uc.client_id,
    uc.role,
    c.name
  FROM client_mgmt.user_clients uc
  JOIN client_mgmt.clients c ON uc.client_id = c.id
  WHERE uc.user_id = $1 AND uc.is_active = true
  ORDER BY c.name`,
  [user_id]
);
```
**Context**: GET /api/extension/user/clients endpoint  
**Purpose**: Get all active clients for authenticated user  
**Parameters**: `user_id` (from auth token)  
**Returns**: Client list with roles for extension dropdown

### Query 2: Verify Client Access (Line 47)
```javascript
const clientAccess = await req.db.query(
  `SELECT 1 FROM client_mgmt.user_clients uc
   WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true`,
  [req.user.user_id, clientId]
);
```
**Context**: POST /api/extension/query endpoint  
**Purpose**: Verify user has access to specified client  
**Parameters**: `user_id`, `client_id` (from header)  
**Returns**: Access verification (row count check)

### Query 3: Full-text Search (Line 58)
```javascript
const searchResult = await req.db.query(
  `SELECT 
    t.content,
    t.timestamp,
    t.speaker_name,
    m.title as meeting_title,
    ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', $1)) as rank
  FROM meetings.turns t
  JOIN meetings.meetings m ON t.meeting_id = m.meeting_id
  WHERE m.client_id = $2 
    AND to_tsvector('english', t.content) @@ plainto_tsquery('english', $1)
  ORDER BY rank DESC, t.timestamp DESC
  LIMIT 10`,
  [query, clientId]
);
```
**Context**: POST /api/extension/query endpoint  
**Purpose**: Full-text search across client's conversation history  
**Parameters**: `query` (search terms), `client_id`  
**Returns**: Ranked search results with conversation context  
**Note**: Has potential bug - JOIN uses `m.meeting_id` instead of `m.id`

## Proposed DatabaseAgent Methods

```javascript
// Extension API operations
async getUserClients(userId)
async verifyClientAccess(userId, clientId)  
async searchConversations(query, clientId, limit = 10)
```

## Domain Classification
- **Primary**: Extension Integration
- **Secondary**: Full-text Search
- **Tertiary**: Access Control

## Notes
- **POTENTIAL BUG**: JOIN uses `m.meeting_id` instead of `m.id` in search query
- Uses PostgreSQL full-text search with ranking
- Proper authentication and authorization checks
- Formats search results for extension consumption
- Limited to 10 results for performance