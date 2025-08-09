# DatabaseAgent Architecture Design

## Problem
- 93 queries across 26 files need centralization
- Putting all methods in DatabaseAgent would create a 2000+ line file
- Need maintainable, modular architecture

## Proposed Solution: Domain-Driven Modules

### Current Structure (Partial)
```
lib/database-agent.js (Main orchestrator)
lib/database-agent/
  ├── database-connector.js (Base connection/query)
  ├── schema-inspector.js
  ├── transcript-processor.js
  └── search-analyzer.js
```

### Proposed Complete Structure
```
lib/database-agent.js (Main orchestrator - stays small)
lib/database-agent/
  ├── core/
  │   ├── database-connector.js (Base connection/query)
  │   └── schema-inspector.js
  ├── domains/
  │   ├── meeting-operations.js (23 queries)
  │   ├── turn-operations.js (9 queries)
  │   ├── user-operations.js (5 queries)
  │   ├── file-operations.js (19 queries)
  │   └── location-operations.js (11 queries)
  └── specialized/
      ├── search-analyzer.js (existing)
      ├── transcript-processor.js (existing)
      └── analytics-engine.js (new)
```

## Query Distribution

| Domain | Query Count | Module |
|--------|------------|---------|
| Meetings | 23 | meeting-operations.js |
| Turns | 9 | turn-operations.js |
| Users/Auth | 5 | user-operations.js |
| Files/Uploads | 19 | file-operations.js |
| Locations | 11 | location-operations.js |
| Search/Analytics | 26 | search-analyzer.js + analytics-engine.js |

## Implementation Example

### Main DatabaseAgent (stays small ~150 lines)
```javascript
// lib/database-agent.js
import { DatabaseConnector } from './database-agent/core/database-connector.js';
import { MeetingOperations } from './database-agent/domains/meeting-operations.js';
import { TurnOperations } from './database-agent/domains/turn-operations.js';
import { UserOperations } from './database-agent/domains/user-operations.js';
// ... other imports

export class DatabaseAgent {
  constructor() {
    // Core
    this.connector = new DatabaseConnector();
    
    // Domain operations
    this.meetings = new MeetingOperations(this.connector);
    this.turns = new TurnOperations(this.connector);
    this.users = new UserOperations(this.connector);
    this.files = new FileOperations(this.connector);
    this.locations = new LocationOperations(this.connector);
    
    // Specialized operations
    this.search = new SearchAnalyzer(this.connector);
    this.transcripts = new TranscriptProcessor(this.connector);
    this.analytics = new AnalyticsEngine(this.connector);
  }
  
  // Delegate to domain modules
  async getMeetingByBotId(botId, excludeStatuses) {
    return this.meetings.getByBotId(botId, excludeStatuses);
  }
  
  // Or use direct access
  // dbAgent.meetings.getByBotId(botId)
}
```

### Domain Module Example
```javascript
// lib/database-agent/domains/meeting-operations.js
export class MeetingOperations {
  constructor(connector) {
    this.connector = connector;
  }
  
  async getByBotId(botId, excludeStatuses = ['completed', 'inactive']) {
    const query = `
      SELECT * FROM meetings.meetings 
      WHERE recall_bot_id = $1 
      AND status NOT IN (${excludeStatuses.map((_, i) => `$${i + 2}`).join(', ')})
    `;
    const params = [botId, ...excludeStatuses];
    const result = await this.connector.query(query, params);
    return result.rows[0] || null;
  }
  
  async create(meetingData) { /* ... */ }
  async update(meetingId, updates) { /* ... */ }
  async delete(meetingId) { /* ... */ }
  async list(filters = {}) { /* ... */ }
  async getActiveCount() { /* ... */ }
  // ... 17 more meeting-specific methods
}
```

## Usage Patterns

### Pattern 1: Through Main Agent (Recommended for common operations)
```javascript
const dbAgent = new DatabaseAgent();
const meeting = await dbAgent.getMeetingByBotId(botId);
```

### Pattern 2: Direct Domain Access (For domain-specific code)
```javascript
const dbAgent = new DatabaseAgent();
const meetings = await dbAgent.meetings.list({ status: 'active' });
const turnCount = await dbAgent.turns.countByMeeting(meetingId);
```

### Pattern 3: Transaction Support
```javascript
await dbAgent.transaction(async (client) => {
  await dbAgent.meetings.create(meetingData, client);
  await dbAgent.turns.recordBatch(turns, client);
});
```

## Benefits

1. **Manageable File Sizes**: Each module ~200-400 lines instead of one 2000+ line file
2. **Domain Cohesion**: Related queries stay together
3. **Easy Testing**: Mock individual domains
4. **Gradual Migration**: Migrate one domain at a time
5. **Clear Ownership**: Teams can own specific domains
6. **Type Safety**: Each domain can have its own types
7. **Performance**: Only load needed domains (with dynamic imports if needed)

## Migration Strategy

### Phase 1: Create Domain Modules (Current)
1. Create meeting-operations.js with getMeetingByBotId
2. Test with one service (meeting-cleanup-service.js)
3. Validate pattern works

### Phase 2: Migrate by Priority
1. Meetings (23 queries) - Most complex, highest value
2. Files (19 queries) - Currently broken with mixed tables
3. Locations (11 queries) - Self-contained
4. Turns (9 queries) - Core functionality
5. Users (5 queries) - Authentication critical

### Phase 3: Deprecate Direct Access
1. Mark pool.query() as deprecated
2. Add linting rules
3. Monitor and migrate stragglers

## File Size Estimates

| File | Estimated Lines | Status |
|------|----------------|---------|
| database-agent.js | ~150 | ✅ Good |
| meeting-operations.js | ~400 | ✅ Good |
| turn-operations.js | ~200 | ✅ Good |
| user-operations.js | ~150 | ✅ Good |
| file-operations.js | ~350 | ✅ Good |
| location-operations.js | ~250 | ✅ Good |
| search-analyzer.js | ~300 | ✅ Exists |
| transcript-processor.js | ~200 | ✅ Exists |

Total: ~2000 lines across 8 files instead of one giant file