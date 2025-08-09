# server/routes/auth.js - Query Catalog

## File Summary
- **Purpose**: User authentication and session management
- **Query Count**: 2 queries
- **Main Operations**: User login with password verification, client association lookup

## Query Analysis

### Query 1: Find Users by Email (Line 50)
```javascript
const userResult = await req.db.query(
  'SELECT id, email, password_hash FROM client_mgmt.users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
  [email]
);
```
**Context**: POST /api/auth/login endpoint  
**Purpose**: Find all users with matching email (handles duplicates)  
**Parameters**: `email`  
**Returns**: All matching users with password hashes for verification

### Query 2: Get User Clients (Line 76)
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
  [authenticatedUser.id]
);
```
**Context**: POST /api/auth/login endpoint  
**Purpose**: Get all active client associations for authenticated user  
**Parameters**: `user_id`  
**Returns**: Client list with roles for session setup

## Proposed DatabaseAgent Methods

```javascript
// Authentication operations
async findUsersByEmail(email)
async getUserClients(userId)
async authenticateUser(email, password) // Combines both queries
```

## Domain Classification
- **Primary**: Authentication
- **Secondary**: Session Management
- **Pattern**: Login flow with multi-client support

## Notes
- Handles case-insensitive email matching with trimming
- Supports duplicate emails by checking passwords against all matches
- Auto-selects single client, prompts for selection with multiple clients
- Creates session meeting immediately after successful single-client login
- Proper bcrypt password hashing verification
- Session management with both full session and pending states
- Backward compatibility with header-based auth from cogito-repl proxy