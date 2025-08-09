# DatabaseAgent Migration Example

## Overview
This document demonstrates how to migrate from direct database queries to using the centralized DatabaseAgent.

## Example Migration: getMeetingByBotId

### Before (Direct Query)
```javascript
// In server/services/meeting-cleanup-service.js
const meetingResult = await this.pool.query(
  'SELECT * FROM meetings.meetings WHERE recall_bot_id = $1 AND status NOT IN ($2, $3)',
  [botId, 'completed', 'inactive']
);

if (meetingResult.rows.length === 0) {
  console.log(`Meeting ${botId} not found or already completed`);
  return;
}

const meeting = meetingResult.rows[0];
```

### After (Using DatabaseAgent)

#### Step 1: Add Method to DatabaseAgent
```javascript
// In lib/database-agent.js
async getMeetingByBotId(botId, excludeStatuses = ['completed', 'inactive']) {
  const query = `
    SELECT * FROM meetings.meetings 
    WHERE recall_bot_id = $1 
    AND status NOT IN (${excludeStatuses.map((_, i) => `$${i + 2}`).join(', ')})
  `;
  const params = [botId, ...excludeStatuses];
  const result = await this.connector.query(query, params);
  return result.rows[0] || null;
}
```

#### Step 2: Update Service to Use DatabaseAgent
```javascript
// In server/services/meeting-cleanup-service.js
import { DatabaseAgent } from '../../lib/database-agent.js';

export class MeetingCleanupService {
  constructor(pool, meetingLastActivity, transcriptService) {
    this.pool = pool;
    this.dbAgent = new DatabaseAgent();
    // ...
  }

  async completeMeetingByInactivity(botId, reason = 'inactivity') {
    // Get meeting info using DatabaseAgent
    const meeting = await this.dbAgent.getMeetingByBotId(botId);
    
    if (!meeting) {
      console.log(`Meeting ${botId} not found or already completed`);
      return;
    }
    // ...
  }
}
```

## Benefits of This Approach

1. **Centralized Logic**: Query logic is in one place, making it easier to maintain
2. **Reusability**: The `getMeetingByBotId` method can be used by any service
3. **Type Safety**: Return types are consistent (null vs empty array)
4. **Flexibility**: Parameters like `excludeStatuses` can be customized
5. **Testing**: Easier to mock and test a single method
6. **Performance Monitoring**: All queries go through DatabaseConnector with built-in timing

## Migration Strategy

1. **Identify Query**: Find a direct pool.query() call
2. **Create Method**: Add a semantic method to DatabaseAgent
3. **Update Service**: Import DatabaseAgent and replace direct query
4. **Test**: Verify the migration works correctly
5. **Document**: Add the new method to API documentation

## Next Steps

Continue this pattern for all 90+ queries identified in the catalog:
- Meeting queries (create, update, list, delete)
- Turn queries (record, search, analyze)
- User/auth queries (login, permissions, stats)
- File/context queries (upload, retrieve, search)