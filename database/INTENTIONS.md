# Database System

## Purpose
Comprehensive database abstraction layer providing unified access to PostgreSQL database through specialized domain operations. Implements the DatabaseAgent pattern with modular components for connection management, schema inspection, query building, and domain-specific operations.

## Core Database Architecture

### `database-agent.js`
**Purpose**: Main DatabaseAgent orchestrator and component coordinator
- Coordinates specialized database modules and domain operations
- Provides unified interface for all database interactions
- Manages component initialization and dependency injection
- Implements modular architecture for maintainable database operations

```javascript
export class DatabaseAgent {
  constructor() {
    // 1. Initialize core database infrastructure
    this.connector = new DatabaseConnector();
    this.schemaInspector = new SchemaInspector(this.connector);
    this.queryBuilder = new EnforcedQueryBuilder(this.schemaInspector);
    
    // 2. Initialize domain operations modules (order matters for dependencies)
    this.users = new UserOperations(this.connector);
    this.turns = new TurnOperations(this.connector);
    this.files = new FileOperations(this.connector);
    this.locations = new LocationOperations(this.connector);
    this.bots = new BotOperations(this.connector);
    this.clients = new ClientOperations(this.connector);
    this.clientSettings = new ClientSettingsOperations(this.connector);
    this.designGames = new DesignGamesOperations(this.connector);
    this.summaries = new SummaryOperations(this.connector);
    this.llms = new LLMOperations(this.connector);
    
    // 3. Initialize meetings last (depends on turns operations)
    this.meetings = new MeetingOperations(this.connector);
    this.meetings.setTurnsOperations(this.turns);
    
    // 4. Initialize specialized processors
    this.transcriptProcessor = new TranscriptProcessor(this.connector, this.meetings, this.turns);
    this.searchAnalyzer = new SearchAnalyzer(this.connector);
  }
  
  async connect() {
    // 1. Establish database connection
    await this.connector.connect();
    
    // 2. Initialize schema inspection
    await this.schemaInspector.initializeSchemaCache();
    
    // 3. Verify database connectivity
    await this.verifyConnection();
  }
  
  async disconnect() {
    // 1. Clean up active transactions
    await this.connector.cleanup();
    
    // 2. Close connection pool
    await this.connector.disconnect();
  }
}
```

## Core Infrastructure Components

### `database-agent/core/` Directory

#### `database-connector.js`
**Purpose**: Database connection management and query execution
- Manages PostgreSQL connection pool and lifecycle
- Handles transaction management and isolation
- Provides query execution with parameter binding
- Implements connection health monitoring and recovery

```javascript
export class DatabaseConnector {
  async connect() {
    // 1. Initialize PostgreSQL connection pool
    // 2. Configure connection parameters and timeouts
    // 3. Test initial connectivity
    // 4. Set up connection health monitoring
  }
  
  async query(sql, params = []) {
    // 1. Acquire connection from pool
    // 2. Execute parameterized query
    // 3. Handle query errors and timeouts
    // 4. Return results and release connection
  }
  
  async beginTransaction() {
    // 1. Begin database transaction
    // 2. Return transaction context
    // 3. Handle transaction isolation levels
  }
  
  async commitTransaction(transaction) {
    // 1. Commit transaction changes
    // 2. Release transaction resources
  }
  
  async rollbackTransaction(transaction) {
    // 1. Rollback transaction changes
    // 2. Clean up transaction state
  }
}
```

#### `schema-inspector.js`
**Purpose**: Database schema introspection and caching
- Inspects database schema structure and metadata
- Caches schema information for performance
- Validates table and column existence
- Provides schema change detection

```javascript
export class SchemaInspector {
  async initializeSchemaCache() {
    // 1. Query information_schema for all tables
    // 2. Load column definitions and constraints
    // 3. Build schema cache structure
    // 4. Set up schema change monitoring
  }
  
  async getTableSchema(schemaName, tableName) {
    // 1. Check cache for table schema
    // 2. Return cached schema or query database
    // 3. Update cache with fresh data
  }
  
  async verifyTableExists(schemaName, tableName) {
    // 1. Check table existence in schema cache
    // 2. Verify against live database if needed
    // 3. Return existence confirmation
  }
}
```

## Utility Components

### `database-agent/utils/` Directory

#### `enforced-query-builder.js`
**Purpose**: Schema-aware query builder with validation
- Builds SQL queries with schema validation
- Enforces table and column existence checks
- Provides parameterized query construction
- Implements query optimization and safety

```javascript
export class EnforcedQueryBuilder {
  constructor(schemaInspector) {
    this.schemaInspector = schemaInspector;
  }
  
  async buildSelect(schemaName, tableName, conditions = {}, options = {}) {
    // 1. Verify table exists in schema
    await this.schemaInspector.verifyTableExists(schemaName, tableName);
    
    // 2. Validate column names against schema
    const tableSchema = await this.schemaInspector.getTableSchema(schemaName, tableName);
    
    // 3. Build parameterized SELECT query
    const query = this.constructSelectQuery(schemaName, tableName, conditions, options);
    const values = this.extractParameterValues(conditions);
    
    return { query, values };
  }
  
  async buildInsert(schemaName, tableName, data) {
    // 1. Verify table and columns exist
    // 2. Validate data against schema constraints
    // 3. Build parameterized INSERT query
    // 4. Return query and parameter values
  }
  
  async buildUpdate(schemaName, tableName, updates, conditions) {
    // 1. Verify table schema and constraints
    // 2. Build parameterized UPDATE query
    // 3. Include WHERE conditions safely
    // 4. Return query and parameter values
  }
}
```

#### `query-builders.js`
**Purpose**: General-purpose query construction utilities
- Provides query building helper functions
- Handles complex query patterns and joins
- Implements dynamic query construction
- Supports various PostgreSQL features

#### `schema-validator.js`
**Purpose**: Database schema validation and consistency checking
- Validates schema integrity and constraints
- Checks referential integrity
- Identifies schema inconsistencies
- Provides schema migration assistance

## Domain Operations

### `database-agent/domains/` Directory
Contains specialized domain-specific operation modules:

#### `user-operations.js`
**Purpose**: User management and authentication operations
- User CRUD operations and authentication
- OAuth integration and user provisioning
- User preferences and settings management
- Client access permissions and roles

#### `meeting-operations.js`
**Purpose**: Meeting lifecycle and transcript management
- Meeting creation, updates, and lifecycle management
- Transcript processing and storage
- Meeting participant tracking
- Meeting metadata and context handling

#### `file-operations.js`
**Purpose**: File upload, processing, and chunk management
- File metadata storage and retrieval
- File content chunking and embedding storage
- File access permissions and sharing
- Search and similarity operations on file content

#### `turn-operations.js`
**Purpose**: Conversation turn processing and storage
- Turn creation and content storage
- Embedding generation and storage
- Turn search and similarity matching
- Turn metadata and context management

#### `client-operations.js`
**Purpose**: Multi-tenant client management and administration
- Client creation and configuration
- User-client association and permissions
- Client settings and customization
- Administrative operations and reporting

#### `bot-operations.js`
**Purpose**: Meeting bot creation and management
- Bot configuration and lifecycle management
- External bot API integration (Recall.ai)
- Bot status tracking and webhook processing
- Bot transcript and recording handling

## Specialized Processors

### `database-agent/specialized/` Directory

#### `transcript-processor.js`
**Purpose**: Transcript import and intelligent processing
- Transcript data import and normalization
- Speaker identification and turn segmentation
- Content analysis and insight extraction
- Transcript quality assessment and validation

```javascript
export class TranscriptProcessor {
  async importTranscript(transcriptData, meetingId) {
    // 1. Validate transcript data format
    // 2. Process speaker identification
    // 3. Segment transcript into turns
    // 4. Store turns with proper associations
    // 5. Generate embeddings for search
    // 6. Return import results and statistics
  }
  
  async processTranscriptAnalysis(meetingId) {
    // 1. Analyze conversation patterns
    // 2. Extract key topics and themes
    // 3. Identify speaker characteristics
    // 4. Generate meeting insights
    // 5. Store analysis results
  }
}
```

#### `search-analyzer.js`
**Purpose**: Search operations and analytics
- Vector-based similarity search
- Full-text search capabilities
- Search result ranking and filtering
- Search analytics and usage patterns

```javascript
export class SearchAnalyzer {
  async performVectorSearch(queryEmbedding, clientId, options = {}) {
    // 1. Execute vector similarity search
    // 2. Apply client access filtering
    // 3. Rank results by relevance
    // 4. Include result metadata and context
    // 5. Return formatted search results
  }
  
  async analyzeSearchPatterns(clientId, timeRange) {
    // 1. Query search history and patterns
    // 2. Analyze common search terms
    // 3. Identify trending topics
    // 4. Generate search insights
    // 5. Return analytics summary
  }
}
```

#### `transcript-importer.js`
**Purpose**: Transcript data import utilities
- Handles various transcript formats
- Manages bulk transcript imports
- Provides import validation and error handling
- Supports transcript format conversion

## Database Integration Patterns

### Connection Management
```javascript
export class DatabaseConnectionManager {
  async ensureConnection(dbAgent) {
    // 1. Check if connection is active
    if (!dbAgent.connector.isConnected()) {
      await dbAgent.connect();
    }
    
    // 2. Verify connection health
    await dbAgent.connector.validateConnection();
    
    // 3. Return ready database agent
    return dbAgent;
  }
  
  async withTransaction(dbAgent, operation) {
    // 1. Begin transaction
    const transaction = await dbAgent.connector.beginTransaction();
    
    try {
      // 2. Execute operation within transaction
      const result = await operation(dbAgent, transaction);
      
      // 3. Commit on success
      await dbAgent.connector.commitTransaction(transaction);
      return result;
    } catch (error) {
      // 4. Rollback on error
      await dbAgent.connector.rollbackTransaction(transaction);
      throw error;
    }
  }
}
```

### Query Optimization
```javascript
export class DatabaseQueryOptimizer {
  optimizeSelectQuery(baseQuery, options = {}) {
    // 1. Add appropriate indexes hints
    // 2. Optimize JOIN operations
    // 3. Add LIMIT clauses for large results
    // 4. Include query plan optimization
    
    let optimizedQuery = baseQuery;
    
    if (options.limit) {
      optimizedQuery += ` LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      optimizedQuery += ` OFFSET ${options.offset}`;
    }
    
    return optimizedQuery;
  }
}
```

## Security and Access Control

### Database Security Manager
```javascript
export class DatabaseSecurityManager {
  validateClientAccess(userId, clientId, operation) {
    // 1. Verify user has access to client
    // 2. Check operation permissions
    // 3. Apply row-level security
    // 4. Log access attempts
    // 5. Return access decision
  }
  
  sanitizeQueryParams(params) {
    // 1. Validate parameter types
    // 2. Escape dangerous characters
    // 3. Apply input sanitization
    // 4. Prevent SQL injection
    // 5. Return safe parameters
  }
}
```

## Error Handling and Recovery

### Database Error Manager
```javascript
export class DatabaseErrorManager {
  handleDatabaseError(error, context) {
    // 1. Classify error type
    const errorType = this.classifyError(error);
    
    // 2. Log error with context
    console.error(`Database Error [${errorType}]:`, {
      error: error.message,
      context,
      stack: error.stack
    });
    
    // 3. Apply recovery strategy
    switch (errorType) {
      case 'CONNECTION_FAILED':
        return this.retryConnection(context);
        
      case 'CONSTRAINT_VIOLATION':
        return this.handleConstraintError(error, context);
        
      case 'SCHEMA_MISMATCH':
        return this.refreshSchemaCache(context);
        
      default:
        throw error;
    }
  }
}
```

## Performance Monitoring

### Database Performance Monitor
```javascript
export class DatabasePerformanceMonitor {
  async monitorQueryPerformance(query, params, executionTime) {
    // 1. Record query execution metrics
    // 2. Identify slow queries
    // 3. Track connection pool usage
    // 4. Monitor memory consumption
    // 5. Generate performance reports
  }
  
  async optimizeConnectionPool(metrics) {
    // 1. Analyze connection usage patterns
    // 2. Adjust pool size based on load
    // 3. Optimize connection timeout settings
    // 4. Balance resource usage
  }
}
```

## Testing Strategies

### Database Agent Testing
```javascript
describe('Database Agent', () => {
  let dbAgent;
  
  beforeEach(async () => {
    dbAgent = new DatabaseAgent();
    await dbAgent.connect();
  });
  
  afterEach(async () => {
    await dbAgent.disconnect();
  });
  
  test('connects to database successfully', async () => {
    expect(dbAgent.connector.isConnected()).toBe(true);
  });
  
  test('domain operations are initialized', () => {
    expect(dbAgent.users).toBeInstanceOf(UserOperations);
    expect(dbAgent.meetings).toBeInstanceOf(MeetingOperations);
    expect(dbAgent.files).toBeInstanceOf(FileOperations);
  });
  
  test('query builder validates schema', async () => {
    const { query, values } = await dbAgent.queryBuilder.buildSelect('client_mgmt', 'users', {
      email: 'test@example.com'
    });
    
    expect(query).toContain('SELECT');
    expect(query).toContain('client_mgmt.users');
    expect(values).toEqual(['test@example.com']);
  });
});
```

### Integration Testing
```javascript
describe('Database Integration', () => {
  test('user operations work with real database', async () => {
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    const user = await dbAgent.users.createUser({
      name: 'Test User',
      email: 'test@example.com'
    });
    
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
    
    await dbAgent.disconnect();
  });
});
```