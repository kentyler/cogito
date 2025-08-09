# DatabaseAgent Migration Guide

## Overview

This guide helps migrate from direct SQL queries to DatabaseAgent domain operations. The DatabaseAgent centralizes database access through domain-specific interfaces, improving maintainability, testability, and consistency.

## Migration Benefits

- **Centralized Operations**: No more scattered SQL across 33+ files
- **Type Safety**: Consistent method signatures and return types
- **Transaction Support**: Built-in transaction handling for complex operations
- **Error Handling**: Standardized error responses and null handling
- **Testing**: Comprehensive test coverage for all operations
- **Maintainability**: Domain-driven organization

## Basic Migration Pattern

### Before (Direct SQL)
```javascript
// OLD: Direct database queries
router.get('/api/users', async (req, res) => {
  try {
    const result = await req.db.query('SELECT * FROM client_mgmt.users');
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});
```

### After (DatabaseAgent)
```javascript
// NEW: DatabaseAgent domain operations
import { DatabaseAgent } from '../lib/database-agent.js';

const dbAgent = new DatabaseAgent();

router.get('/api/users', async (req, res) => {
  try {
    // Ensure connection
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    
    const users = await dbAgent.users.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});
```

## Domain-Specific Migrations

### User Operations

**Before:**
```javascript
// User creation with password hashing
const hashedPassword = await bcrypt.hash(password, 10);
const result = await req.db.query(`
  INSERT INTO client_mgmt.users (email, password_hash, metadata, created_at)
  VALUES ($1, $2, $3, NOW())
  RETURNING *
`, [email, hashedPassword, metadata]);
const user = result.rows[0];
```

**After:**
```javascript
// Password hashing handled internally
const user = await dbAgent.users.create({ email, password, metadata });
```

### Meeting Operations

**Before:**
```javascript
// Complex meeting query with joins
const result = await req.db.query(`
  SELECT 
    m.*,
    COUNT(t.id) as turn_count,
    u.email as creator_email
  FROM meetings.meetings m
  LEFT JOIN meetings.turns t ON m.id = t.meeting_id
  LEFT JOIN client_mgmt.users u ON m.created_by_user_id = u.id
  WHERE m.client_id = $1 AND m.status != 'inactive'
  GROUP BY m.id, u.email
  ORDER BY m.created_at DESC
  LIMIT $2
`, [clientId, limit]);
```

**After:**
```javascript
// Built-in statistics and joins
const meetings = await dbAgent.meetings.listWithStats(clientId, { 
  limit, 
  includeInactive: false 
});
```

### File Operations

**Before:**
```javascript
// Transactional file and chunk deletion
await req.db.query('BEGIN');
try {
  // Delete chunks first
  await req.db.query('DELETE FROM context.chunks WHERE file_id = $1', [fileId]);
  
  // Delete file
  const result = await req.db.query(`
    DELETE FROM context.files 
    WHERE id = $1 AND client_id = $2
    RETURNING *
  `, [fileId, clientId]);
  
  if (result.rows.length === 0) {
    throw new Error('File not found');
  }
  
  await req.db.query('COMMIT');
  res.json({ success: true });
} catch (error) {
  await req.db.query('ROLLBACK');
  throw error;
}
```

**After:**
```javascript
// Built-in transactional deletion
const result = await dbAgent.files.deleteFile(fileId, clientId);
res.json({ success: true, ...result });
```

### Turn Operations with Embeddings

**Before:**
```javascript
// Complex similarity search
const result = await req.db.query(`
  WITH target_turn AS (
    SELECT content_embedding, meeting_id
    FROM meetings.turns
    WHERE id = $1 AND content_embedding IS NOT NULL
  )
  SELECT 
    t.id, t.content, t.metadata,
    1 - (t.content_embedding <=> tt.content_embedding) as similarity
  FROM meetings.turns t
  CROSS JOIN target_turn tt
  WHERE t.id != $1
    AND t.content_embedding IS NOT NULL
    AND 1 - (t.content_embedding <=> tt.content_embedding) >= $2
  ORDER BY similarity DESC
  LIMIT $3
`, [turnId, minSimilarity, limit]);
```

**After:**
```javascript
// Domain-specific similarity search
const similarTurns = await dbAgent.turns.findSimilarTurns(turnId, limit, minSimilarity);
```

## Specific File Migrations

### 1. Auth Routes (`server/routes/auth.js`)

**Migration Status**: ✅ Already migrated

**Changes Made:**
- Replaced direct password hashing with `dbAgent.users.create()`
- Used `dbAgent.users.authenticate()` for login
- Simplified user lookup with `dbAgent.users.getByEmail()`

### 2. Upload Files (`server/routes/upload-files.js`)

**Migration Status**: ✅ Already migrated

**Key Changes:**
```javascript
// OLD: Direct file queries (163 lines)
const result = await req.pool.query(`
  SELECT f.*, COUNT(c.id) as chunk_count
  FROM context.files f
  LEFT JOIN context.chunks c ON f.id = c.file_id
  WHERE f.client_id = $1
  GROUP BY f.id
  ORDER BY f.created_at DESC
`);

// NEW: Domain operation (106 lines)
const files = await dbAgent.files.getClientFiles(client_id, ['upload', 'text-input']);
```

### 3. Bot Management (`server/routes/bots-management.js`)

**Migration Status**: ✅ Already migrated

**Key Changes:**
```javascript
// OLD: Direct bot status queries (137 lines)
const result = await req.db.query(`
  SELECT id, recall_bot_id as bot_id, meeting_url, name, status
  FROM meetings.meetings
  WHERE status = 'active' AND meeting_type != 'system'
`);

// NEW: Domain operation (116 lines)
const activeBots = await dbAgent.bots.getActiveBots();
```

### 4. Location Manager (`lib/location-manager.js`)

**Migration Status**: ✅ Already migrated

**Key Changes:**
```javascript
// OLD: Direct location queries (200 lines)
const result = await this.db.query(`
  WITH matches AS (SELECT * FROM locations WHERE file_path ILIKE $1...)
  UPDATE locations SET last_accessed = NOW()
  WHERE id IN (SELECT id FROM matches)
  RETURNING *
`);

// NEW: Domain delegation (91 lines)
return await this.dbAgent.locations.searchWithAccessUpdate(searchTerm);
```

## Connection Management Patterns

### Singleton Pattern (Recommended for Routes)
```javascript
// At module level
import { DatabaseAgent } from '../lib/database-agent.js';
const dbAgent = new DatabaseAgent();

// In route handlers
router.get('/api/endpoint', async (req, res) => {
  // Ensure connection
  if (!dbAgent.connector.pool) {
    await dbAgent.connect();
  }
  
  const result = await dbAgent.domain.operation();
  res.json(result);
});
```

### Instance Pattern (For Services)
```javascript
export class MyService {
  constructor() {
    this.dbAgent = new DatabaseAgent();
  }
  
  async initialize() {
    await this.dbAgent.connect();
  }
  
  async doWork() {
    return await this.dbAgent.domain.operation();
  }
  
  async close() {
    await this.dbAgent.close();
  }
}
```

### Transaction Pattern
```javascript
// Complex multi-operation workflows
const result = await dbAgent.transaction(async (client) => {
  const user = await dbAgent.users.create(userData);
  const meeting = await dbAgent.meetings.create({
    ...meetingData,
    created_by_user_id: user.id
  });
  const turn = await dbAgent.turns.createTurn({
    ...turnData,
    meeting_id: meeting.id,
    user_id: user.id
  });
  
  return { user, meeting, turn };
});
```

## Error Handling Migration

### Before (Manual Error Checks)
```javascript
const result = await req.db.query('SELECT * FROM users WHERE id = $1', [id]);
if (result.rows.length === 0) {
  return res.status(404).json({ error: 'User not found' });
}
const user = result.rows[0];
```

### After (Null Returns)
```javascript
const user = await dbAgent.users.getById(id);
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

## Testing Migration

### Before (Manual Database Setup)
```javascript
// Complex test setup
beforeEach(async () => {
  await db.query('DELETE FROM test_tables');
  await db.query('INSERT INTO test_data...');
});
```

### After (Test Fixtures)
```javascript
// Built-in test helpers
import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

const dbAgent = await getTestDbAgent();
const testData = await TestFixtures.createTestMeeting(dbAgent);
// ... run tests
await cleanupTestData(dbAgent);
```

## Performance Considerations

1. **Connection Reuse**: DatabaseAgent instances reuse connections
2. **Query Optimization**: Domain operations include optimized queries
3. **Transaction Support**: Automatic transaction handling for multi-step operations
4. **Prepared Statements**: Consistent parameter binding prevents SQL injection

## Migration Checklist

- [ ] **Replace direct SQL** with domain operations
- [ ] **Add DatabaseAgent import** and initialization
- [ ] **Update error handling** to expect null returns
- [ ] **Use transactions** for multi-operation workflows
- [ ] **Test thoroughly** with new domain operations
- [ ] **Update imports** to remove direct database dependencies
- [ ] **Clean up** unused SQL queries and helper functions

## Remaining Files to Migrate

Based on the database queries catalog, these files still contain direct SQL and can be migrated:

1. **WebSocket Services** - Socket.io message handling
2. **Webhook Handlers** - External API integrations  
3. **Turn Recording Pipeline** - Background processing
4. **Admin Routes** - System administration
5. **Analytics Scripts** - Reporting and metrics

Each should follow the patterns established in this migration guide.

## Getting Help

- **API Reference**: See `docs/database-agent-api.md`
- **Test Examples**: Check `tests/database-agent/domains/` for usage patterns
- **Implementation**: Review migrated files for real-world examples