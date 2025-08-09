# server/services/meeting-cleanup-service.js - Query Catalog

## File Summary
- **Purpose**: Meeting lifecycle management, inactivity cleanup, memory management
- **Query Count**: 6 queries
- **Main Operations**: Complete inactive meetings, find stuck meetings, cleanup memory buffers

## Query Analysis

### Query 1: Get Meeting by Bot ID (Line 19)
```javascript
const meetingResult = await this.pool.query(
  'SELECT * FROM meetings.meetings WHERE recall_bot_id = $1 AND status NOT IN ($2, $3)',
  [botId, 'completed', 'inactive']
);
```
**Context**: `completeMeetingByInactivity` method  
**Purpose**: Find active meeting by bot ID (excludes already completed)  
**Parameters**: `botId`, status exclusions  
**Returns**: Active meeting record for completion

### Query 2: Mark Meeting Completed (Line 38)
```javascript
await this.pool.query(`
  UPDATE meetings.meetings 
  SET status = 'completed',
      ended_at = NOW(),
      updated_at = NOW()
  WHERE recall_bot_id = $1
`, [botId]);
```
**Context**: `completeMeetingByInactivity` method  
**Purpose**: Update meeting status to completed with timestamp  
**Parameters**: `botId`  
**Returns**: Update confirmation

### Query 3: Get Updated Meeting for Email (Line 53)
```javascript
const updatedMeetingResult = await this.pool.query(
  'SELECT * FROM meetings.meetings WHERE id = $1',
  [meeting.id]
);
```
**Context**: `completeMeetingByInactivity` method (email sending)  
**Purpose**: Get fresh meeting data with full transcript for email  
**Parameters**: `meetingId`  
**Returns**: Complete meeting record for transcript email

### Query 4: Find Stuck Meetings (Line 101)
```javascript
const stuckMeetingsResult = await this.pool.query(`
  SELECT id, recall_bot_id, name as meeting_name, created_at, status
  FROM meetings.meetings
  WHERE status IN ('joining', 'active') 
    AND created_at < NOW() - INTERVAL '4 hours'
    AND meeting_type != 'system'
    AND recall_bot_id IS NOT NULL
`);
```
**Context**: `cleanupInactiveMeetings` method  
**Purpose**: Find meetings stuck in joining/active status beyond max duration  
**Parameters**: None (time-based filter)  
**Returns**: List of stuck bot meetings for cleanup

### Query 5: Get Active Meetings for Memory Cleanup (Line 128)
```javascript
const activeMeetings = await this.pool.query(`
  SELECT recall_bot_id FROM meetings
  WHERE status IN ('joining', 'active') AND meeting_type != 'system'
`);
```
**Context**: `cleanupMemoryBuffers` method  
**Purpose**: Get currently active meetings to preserve their memory buffers  
**Parameters**: None  
**Returns**: List of active bot IDs to keep in memory  
**Note**: **BUG IDENTIFIED** - Uses `meetings` instead of `meetings.meetings`

### Query 6: Get Meeting ID by Bot ID (Line 147)
```javascript
const meetingDetails = await this.pool.query(
  'SELECT id FROM meetings.meetings WHERE recall_bot_id = $1',
  [meeting.recall_bot_id]
);
```
**Context**: `cleanupMemoryBuffers` method  
**Purpose**: Convert bot_id to meeting_id for buffer cleanup  
**Parameters**: `recall_bot_id`  
**Returns**: Meeting ID for transcript buffer management

## Proposed DatabaseAgent Methods

```javascript
// Meeting lifecycle management
async getActiveMeetingByBotId(botId)
async completeMeeting(botId, reason = 'inactivity')
async getUpdatedMeetingForEmail(meetingId)
async findStuckMeetings(maxHours = 4)
async getActiveMeetings()
async getMeetingIdByBotId(botId)
```

## Domain Classification
- **Primary**: Meeting Lifecycle Management
- **Secondary**: Memory Management
- **Tertiary**: Periodic Cleanup
- **Pattern**: Time-based cleanup with memory buffer management

## Notes
- **BUG IDENTIFIED**: Query 5 uses `meetings` instead of `meetings.meetings`
- **Previously Fixed**: Most queries updated to correct schema
- Handles both inactivity-based and duration-based cleanup
- Integrates with transcript processing for proper shutdown
- Memory management for real-time buffers
- Email integration for transcript delivery
- Time-based filtering using PostgreSQL intervals