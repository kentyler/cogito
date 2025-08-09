# server/routes/client-management.js - Query Catalog

## File Summary
- **Purpose**: Multi-client session management (select, switch, list clients)
- **Query Count**: 3 queries (same query used 3 times)
- **Main Operations**: Client selection, client switching, available clients listing

## Query Analysis

### Query 1: Verify Client Access - Select (Line 23)
```javascript
const clientResult = await req.db.query(
  `SELECT 
    uc.client_id,
    uc.role,
    c.name as client_name
  FROM client_mgmt.user_clients uc
  JOIN client_mgmt.clients c ON uc.client_id = c.id
  WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true`,
  [user_id, client_id]
);
```
**Context**: POST /api/client-management/select-client endpoint  
**Purpose**: Verify user has access to selected client during initial login  
**Parameters**: `user_id`, `client_id`  
**Returns**: Client details if access allowed

### Query 2: List Available Clients (Line 90)
```javascript
const clientsResult = await req.db.query(
  `SELECT 
    uc.client_id,
    uc.role,
    c.name as client_name
  FROM client_mgmt.user_clients uc
  JOIN client_mgmt.clients c ON uc.client_id = c.id
  WHERE uc.user_id = $1 AND uc.is_active = true
  ORDER BY c.name`,
  [user_id]
);
```
**Context**: GET /api/client-management/available-clients endpoint  
**Purpose**: Get all available clients for authenticated user  
**Parameters**: `user_id`  
**Returns**: Complete list of accessible clients

### Query 3: Verify Client Access - Switch (Line 130)
```javascript
const clientResult = await req.db.query(
  `SELECT 
    uc.client_id,
    uc.role,
    c.name as client_name
  FROM client_mgmt.user_clients uc
  JOIN client_mgmt.clients c ON uc.client_id = c.id
  WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true`,
  [user_id, client_id]
);
```
**Context**: POST /api/client-management/switch-client endpoint  
**Purpose**: Verify user has access to target client when switching  
**Parameters**: `user_id`, `client_id`  
**Returns**: Client details if access allowed

## Proposed DatabaseAgent Methods

```javascript
// Client management operations
async verifyClientAccess(userId, clientId)
async getUserClients(userId)
async getClientDetails(userId, clientId) // Combines verification + details
```

## Domain Classification
- **Primary**: Client Management
- **Secondary**: Session Management  
- **Pattern**: User-client access control with role-based permissions

## Notes
- Same verification query used in both select and switch operations
- Creates session meeting for each client selection/switch
- Proper separation between pending and authenticated states
- All queries include `is_active = true` filtering
- Session management handles role-based permissions