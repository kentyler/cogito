# DatabaseAgent Architecture

## Overview

The DatabaseAgent is a centralized, domain-driven database abstraction layer that replaces scattered SQL queries across 33+ files with organized, testable, and maintainable operations. It implements a **Domain-Driven Design (DDD)** pattern to organize database operations by business domain.

## Core Architecture

### High-Level Structure

```
DatabaseAgent (Main Entry Point)
├── Core Components
│   ├── DatabaseConnector - Connection pool and query execution
│   └── SchemaInspector - Schema introspection and caching
├── Domain Operations (Business Logic Domains)
│   ├── UserOperations - Authentication and user management
│   ├── MeetingOperations - Meeting lifecycle and metadata
│   ├── FileOperations - File and chunk management (context schema)
│   ├── TurnOperations - Conversation turns with embeddings
│   ├── LocationOperations - File location tracking
│   └── BotOperations - Bot lifecycle and status management
└── Specialized Modules (Future)
    ├── TranscriptProcessor - Transcript import and analysis
    └── SearchAnalyzer - Search and user analytics
```

### Modular Design Pattern

Each domain follows a consistent **Core/Extended/Delegation** pattern to maintain the 200-line file size limit:

```
lib/database-agent/domains/
├── file-operations.js (48 lines) - Main delegation class
├── file-operations/
│   ├── file-operations-core.js (132 lines) - Core CRUD operations
│   └── file-operations-extended.js (103 lines) - Statistics and search
├── turn-operations.js (41 lines) - Main delegation class
├── turn-operations/
│   ├── turn-operations-core.js (145 lines) - Core turn management
│   └── turn-operations-extended.js (138 lines) - Semantic search
└── [similar pattern for all domains]
```

## Design Principles

### 1. Domain Separation
Each domain encapsulates operations for a specific business area:
- **Users**: Authentication, profile management
- **Meetings**: Conversation sessions and metadata
- **Files**: Document storage and chunking (context schema)
- **Turns**: Conversation messages with embeddings
- **Locations**: File path tracking and semantic search
- **Bots**: Recall bot lifecycle management

### 2. Schema Isolation
Operations are organized by PostgreSQL schema:
- **client_mgmt schema**: Users, authentication
- **meetings schema**: Meetings, turns, conversation data
- **context schema**: Files, chunks, document processing
- **public schema**: Locations, file tracking

### 3. Connection Management
- **Singleton Pattern**: Single DatabaseAgent instance per service
- **Connection Pooling**: Built-in PostgreSQL connection pool
- **Transaction Support**: Automatic transaction management for multi-step operations
- **Resource Cleanup**: Proper connection cleanup and error handling

### 4. Error Handling Strategy
- **Null Returns**: Operations return `null` for not-found cases (not exceptions)
- **Error Propagation**: Database errors are thrown (connection, constraint violations)
- **Validation**: Input validation at domain boundaries
- **Graceful Degradation**: Operations continue when possible

## Technical Implementation

### Core Components

#### DatabaseConnector
```javascript
class DatabaseConnector {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }
  
  async connect() // Establish connection pool
  async query() // Execute parameterized queries  
  async transaction() // Managed transactions
  async close() // Cleanup connections
}
```

#### SchemaInspector
```javascript
class SchemaInspector {
  constructor(connector) // Cache schema information
  async getTableSchema() // Introspect table structure
  async validateSchema() // Check schema compatibility
}
```

### Domain Operations

#### Delegation Pattern
Each domain uses a delegation pattern to split functionality:

```javascript
export class FileOperations {
  constructor(connector) {
    this._core = new FileOperationsCore(connector);
    this._extended = new FileOperationsExtended(connector);
  }
  
  // Delegate to core operations
  async createFile(data) {
    return await this._core.createFile(data);
  }
  
  // Delegate to extended operations  
  async getFileStats(clientId) {
    return await this._extended.getFileStats(clientId);
  }
}
```

#### Core vs Extended Operations
- **Core**: Basic CRUD operations (Create, Read, Update, Delete)
- **Extended**: Advanced queries (statistics, search, analytics)

### Transaction Management

The DatabaseAgent provides automatic transaction support for multi-operation workflows:

```javascript
const result = await dbAgent.transaction(async (client) => {
  const user = await dbAgent.users.create(userData);
  const meeting = await dbAgent.meetings.create({
    ...meetingData,
    created_by_user_id: user.id
  });
  return { user, meeting };
});
```

## Database Schema Integration

### Multi-Schema Support
The system works across multiple PostgreSQL schemas:

```sql
-- client_mgmt schema (User management)
client_mgmt.users
client_mgmt.sessions

-- meetings schema (Conversation data)  
meetings.meetings
meetings.turns

-- context schema (Document processing)
context.files
context.chunks

-- public schema (File tracking)
locations
```

### Foreign Key Relationships
The domains respect existing foreign key constraints:
- `meetings.turns.meeting_id` → `meetings.meetings.id`
- `context.chunks.file_id` → `context.files.id`
- `meetings.meetings.created_by_user_id` → `client_mgmt.users.id`

### Vector Extensions
Supports PostgreSQL vector extensions for semantic search:
- **pgvector**: Similarity search on `content.chunks.embedding`
- **Cosine Distance**: `1 - (embedding1 <=> embedding2)` for similarity scores
- **Index Support**: Optimized vector indexing for large datasets

## Testing Architecture

### Test Structure
```
tests/database-agent/
├── test-helpers/
│   └── db-setup.js - Test fixtures and utilities
└── domains/
    ├── user-operations.test.js (120 lines)
    ├── meeting-operations.test.js (120 lines) 
    ├── file-operations-basic.test.js (180 lines)
    ├── file-operations-chunks.test.js (195 lines)
    ├── turn-operations.test.js (122 lines)
    ├── location-operations.test.js (125 lines)
    └── bot-operations.test.js (120 lines)
```

### Test Patterns
- **Test Fixtures**: Reusable test data creation (`TestFixtures.createTestMeeting()`)
- **Automatic Cleanup**: Proper test data cleanup after each run
- **Dev Database**: Tests run against development database
- **Comprehensive Coverage**: Tests for all core operations and edge cases

## Migration Strategy

### Phase 1: Core Domains (Completed)
- ✅ UserOperations - Authentication routes migrated
- ✅ MeetingOperations - Core meeting functionality  
- ✅ FileOperations - Upload routes migrated
- ✅ TurnOperations - Turn management ready
- ✅ LocationOperations - Location manager migrated
- ✅ BotOperations - Bot management routes migrated

### Phase 2: Service Integration (In Progress)
- 🔄 WebSocket services - Real-time messaging
- 🔄 Webhook handlers - External integrations
- 🔄 Turn recording pipeline - Background processing
- 🔄 Analytics scripts - Reporting systems

### Phase 3: Advanced Features (Future)
- 📋 TranscriptProcessor domain - Bulk transcript processing
- 📋 SearchAnalyzer domain - Advanced analytics
- 📋 EventOperations domain - Event logging and replay

## Performance Characteristics

### Connection Efficiency
- **Connection Pooling**: Shared connection pool across domains
- **Query Optimization**: Parameterized queries prevent SQL injection
- **Transaction Batching**: Multiple operations in single transaction
- **Schema Caching**: Cached schema information reduces introspection overhead

### Query Patterns
- **Selective Loading**: Load only required columns
- **Join Optimization**: Domain operations include optimized joins
- **Index Utilization**: Queries designed to use existing indexes
- **Vector Search**: Optimized similarity queries with pgvector

## Security Considerations

### SQL Injection Prevention
- **Parameterized Queries**: All user input properly escaped
- **Input Validation**: Domain-level validation before database calls
- **Schema Isolation**: Operations restricted to appropriate schemas

### Authentication Integration
- **Password Hashing**: Built-in bcrypt password hashing in UserOperations
- **Session Management**: Secure session token handling
- **User Lookup**: Safe user identification methods

## Monitoring and Debugging

### Query Logging
- **Development Mode**: Full query logging with parameters
- **Production Mode**: Error-only logging with sanitized parameters
- **Performance Monitoring**: Query execution time tracking

### Error Reporting  
- **Structured Errors**: Consistent error objects with context
- **Error Classification**: Database vs application errors
- **Debug Information**: Helpful error messages for development

## Future Enhancements

### Advanced Features
- **Query Builder**: Fluent query building interface
- **Migration Support**: Automated schema migration tracking
- **Caching Layer**: Redis-based query result caching
- **Audit Logging**: Automatic change tracking

### Performance Optimizations
- **Read Replicas**: Support for read-only database replicas
- **Connection Sharding**: Multiple connection pools for different workloads  
- **Query Analytics**: Automatic slow query identification
- **Bulk Operations**: Optimized batch processing capabilities

---

This architecture enables maintainable, testable, and scalable database operations while preserving the flexibility needed for the Cogito system's conversational AI capabilities.