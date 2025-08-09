# DatabaseAgent API Reference

## Overview

The DatabaseAgent provides a centralized, domain-driven interface for all database operations in the Cogito system. It replaces scattered SQL queries across 33+ files with organized, testable, and maintainable domain operations.

## Architecture

```
DatabaseAgent
├── Core Components
│   ├── DatabaseConnector - Connection and query management
│   └── SchemaInspector - Schema introspection and caching
├── Domain Operations
│   ├── UserOperations - User management and authentication
│   ├── MeetingOperations - Meeting lifecycle and metadata
│   ├── FileOperations - File and chunk management
│   ├── TurnOperations - Conversation turns with embeddings
│   ├── LocationOperations - File location tracking
│   └── BotOperations - Bot lifecycle and status management
└── Specialized Modules
    ├── TranscriptProcessor - Transcript import and analysis
    └── SearchAnalyzer - Search and user analytics
```

## Quick Start

```javascript
import { DatabaseAgent } from './lib/database-agent.js';

const dbAgent = new DatabaseAgent();
await dbAgent.connect();

// Use domain operations
const users = await dbAgent.users.getAll();
const meetings = await dbAgent.meetings.listWithStats(clientId);
await dbAgent.close();
```

## Domain Operations API

### UserOperations

User management and authentication operations.

```javascript
// Create a new user
const user = await dbAgent.users.create({
  email: 'user@example.com',
  password: 'securepassword',
  metadata: { role: 'user' }
});

// Authenticate user
const authResult = await dbAgent.users.authenticate('user@example.com', 'password');

// Get all users
const users = await dbAgent.users.getAll();

// Get user by ID
const user = await dbAgent.users.getById(userId);

// Update user
const updated = await dbAgent.users.update(userId, { 
  metadata: { lastLogin: new Date() } 
});
```

### MeetingOperations

Meeting lifecycle management with status tracking.

**Core Operations:**
```javascript
// Create meeting
const meeting = await dbAgent.meetings.create({
  name: 'Project Standup',
  description: 'Daily standup meeting',
  meeting_type: 'conversation',
  created_by_user_id: userId,
  client_id: clientId,
  recall_bot_id: 'bot-123', // For bot meetings
  status: 'active'
});

// Get meeting by ID
const meeting = await dbAgent.meetings.getById(meetingId);

// Update meeting status
const updated = await dbAgent.meetings.updateStatus(botId, 'completed');

// Delete meeting (cascades to turns)
const result = await dbAgent.meetings.delete(meetingId);
```

**Extended Operations:**
```javascript
// List meetings with statistics
const meetings = await dbAgent.meetings.listWithStats(clientId, {
  limit: 10,
  includeInactive: false
});

// Get active meeting count
const count = await dbAgent.meetings.getActiveCount();

// Get meeting transcript
const transcript = await dbAgent.meetings.getTranscript(meetingId);
```

### FileOperations

File and chunk management for the context schema.

**Core Operations:**
```javascript
// Create file
const file = await dbAgent.files.createFile({
  filename: 'document.pdf',
  file_type: 'application/pdf',
  file_size: 1024000,
  source_type: 'upload',
  client_id: clientId,
  content_data: 'base64encodedcontent...',
  metadata: { uploadedBy: userId }
});

// Get client files
const files = await dbAgent.files.getClientFiles(clientId, ['upload', 'text-input']);

// Get file with content
const fileWithContent = await dbAgent.files.getFileWithContent(fileId);

// Delete file (transactional - removes chunks too)
const result = await dbAgent.files.deleteFile(fileId, clientId);
```

**Extended Operations:**
```javascript
// Create chunk
const chunk = await dbAgent.files.createChunk({
  file_id: fileId,
  chunk_index: 0,
  content: 'This is the chunk content...',
  metadata: { processing: 'complete' },
  embedding: vectorEmbedding
});

// Get file chunks
const chunks = await dbAgent.files.getFileChunks(fileId, { limit: 10 });

// Get file statistics
const stats = await dbAgent.files.getFileStats(clientId);
// Returns: { total_files, total_chunks, total_size_mb, files_by_source }
```

### TurnOperations

Conversation turn management with semantic similarity.

**Core Operations:**
```javascript
// Create turn
const turn = await dbAgent.turns.createTurn({
  user_id: userId,
  content: 'What is the project status?',
  source_type: 'user',
  meeting_id: meetingId,
  metadata: { confidence: 0.95 },
  content_embedding: vectorEmbedding
});

// Get turns for meeting
const turns = await dbAgent.turns.getByMeetingId(meetingId, {
  limit: 100,
  orderBy: 'timestamp ASC'
});

// Update embedding
const updated = await dbAgent.turns.updateEmbedding(turnId, embedding);

// Delete turn
const deleted = await dbAgent.turns.delete(turnId);
```

**Extended Operations (Semantic Search):**
```javascript
// Find similar turns
const similar = await dbAgent.turns.findSimilarTurns(turnId, 10, 0.7);

// Search by embedding similarity
const matches = await dbAgent.turns.searchBySimilarity(
  queryEmbedding, 
  20, // limit
  0.5, // min similarity
  clientId // optional filter
);

// Get embedding statistics
const stats = await dbAgent.turns.getEmbeddingStats(meetingId);
// Returns: { total_turns, embedding_coverage, turns_needing_embedding }
```

### LocationOperations

File location tracking with semantic search and access time updates.

**Core Operations:**
```javascript
// Create/update location
const location = await dbAgent.locations.upsertLocation({
  file_path: '/src/components/Header.jsx',
  description: 'Main application header component',
  project: 'web-app',
  category: 'component',
  tags: 'react,ui,header'
});

// Get location by path (updates access time)
const location = await dbAgent.locations.getByPath('/src/utils/helpers.js');

// Get recent locations
const recent = await dbAgent.locations.getRecent(10);

// Delete location
const deleted = await dbAgent.locations.delete('/old/file.js');
```

**Extended Operations:**
```javascript
// Search with access time update
const results = await dbAgent.locations.searchWithAccessUpdate('react components');

// Get by project/category
const projectFiles = await dbAgent.locations.getByProject('web-app');
const components = await dbAgent.locations.getByCategory('component');

// Get all with filters
const filtered = await dbAgent.locations.getAll({
  project: 'web-app',
  limit: 50,
  offset: 0
});

// Update access times (batch)
await dbAgent.locations.updateAccessTimes(['/file1.js', '/file2.js']);

// Get statistics
const stats = await dbAgent.locations.getStats();
// Returns: { total_locations, total_projects, total_categories }

// Get distinct values
const projects = await dbAgent.locations.getProjects();
const categories = await dbAgent.locations.getCategories();
```

### BotOperations

Bot lifecycle and status management for Recall bots.

**Core Operations:**
```javascript
// Get active bots
const activeBots = await dbAgent.bots.getActiveBots();

// Get stuck meetings
const stuckMeetings = await dbAgent.bots.getStuckMeetings();

// Force complete stuck meeting
const completed = await dbAgent.bots.forceCompleteMeeting(botId);

// Update bot status
const leaving = await dbAgent.bots.setBotStatusLeaving(botId);
const inactive = await dbAgent.bots.setBotStatusInactive(botId);

// Generic status update
const updated = await dbAgent.bots.updateMeetingStatus(botId, 'custom_status');
```

**Extended Operations:**
```javascript
// Get bot meeting details
const botMeeting = await dbAgent.bots.getBotMeeting(botId);

// Get bots by status
const activeBots = await dbAgent.bots.getBotsByStatus('active', 50);

// Get bot statistics
const stats = await dbAgent.bots.getBotStats();
// Returns: { total_bot_meetings, active_bots, joining_bots, completed_bots }
```

## Connection Management

```javascript
const dbAgent = new DatabaseAgent();

// Connect to database
await dbAgent.connect();

// Execute transaction
const result = await dbAgent.transaction(async (client) => {
  const user = await dbAgent.users.create(userData);
  const meeting = await dbAgent.meetings.create({
    ...meetingData,
    created_by_user_id: user.id
  });
  return { user, meeting };
});

// Direct query (when needed)
const result = await dbAgent.query('SELECT NOW() as current_time');

// Close connection
await dbAgent.close();
```

## Error Handling

All domain operations return `null` for not-found cases and throw errors for actual failures:

```javascript
// Returns null if not found
const user = await dbAgent.users.getById('non-existent-id');
if (!user) {
  console.log('User not found');
}

// Throws error for actual problems
try {
  await dbAgent.users.create({ email: 'invalid-email' });
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

## Migration Notes

When migrating from direct SQL queries:

1. **Replace `req.db.query()`** with domain operations
2. **Add connection management** for new DatabaseAgent instances
3. **Update error handling** to expect `null` returns
4. **Use transactions** for multi-operation workflows
5. **Leverage domain-specific methods** instead of complex joins

See `docs/database-agent-migration-guide.md` for detailed migration examples.