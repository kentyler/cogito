# server/routes/bots-management.js - Query Catalog

## File Summary
- **Purpose**: Bot lifecycle management (list active, handle stuck, shutdown)
- **Query Count**: 5 queries
- **Main Operations**: List bots, manage stuck meetings, bot shutdown

## Query Analysis

### Query 1: Get Active Bots (Line 11)
```javascript
const result = await req.db.query(`
  SELECT 
    id,
    recall_bot_id as bot_id,
    meeting_url,
    name as meeting_name,
    status,
    created_at,
    updated_at
  FROM meetings.meetings
  WHERE status = 'active' AND meeting_type != 'system'
  ORDER BY created_at DESC
`);
```
**Context**: GET /api/bots endpoint  
**Purpose**: List all currently active bot meetings  
**Parameters**: None  
**Returns**: Active meetings with bot info

### Query 2: Get Stuck Meetings (Line 36)
```javascript
const result = await req.db.query(`
  SELECT 
    id,
    id as meeting_id,
    meeting_url,
    name as meeting_name,
    status,
    created_at,
    updated_at,
    recall_bot_id as bot_id,
    0 as turn_count
  FROM meetings.meetings
  WHERE status = 'joining' 
    AND meeting_type != 'system' 
    AND recall_bot_id IS NOT NULL
  ORDER BY created_at DESC
`);
```
**Context**: GET /api/stuck-meetings endpoint  
**Purpose**: List meetings stuck in 'joining' status  
**Parameters**: None  
**Returns**: Stuck bot meetings (excludes non-bot meetings)

### Query 3: Force Complete Stuck Meeting (Line 68)
```javascript
const result = await req.db.query(`
  UPDATE meetings.meetings 
  SET status = 'completed', updated_at = NOW()
  WHERE recall_bot_id = $1
  RETURNING *
`, [meetingId]);
```
**Context**: POST /api/stuck-meetings/:meetingId/complete endpoint  
**Purpose**: Force complete a stuck meeting  
**Parameters**: `meetingId` (from URL params)  
**Returns**: Updated meeting record

### Query 4: Bot Leave - Update Status (Line 101)
```javascript
const updateResult = await req.db.query(`
  UPDATE meetings.meetings 
  SET status = 'leaving', updated_at = NOW()
  WHERE recall_bot_id = $1
  RETURNING *
`, [botId]);
```
**Context**: POST /api/bots/:botId/leave endpoint  
**Purpose**: Update bot status to 'leaving' when shutdown initiated  
**Parameters**: `botId` (from URL params)  
**Returns**: Updated meeting record

### Query 5: Bot Leave - Finalize (Line 119)
```javascript
await req.db.query(`
  UPDATE meetings.meetings 
  SET status = 'inactive', updated_at = NOW()
  WHERE recall_bot_id = $1
`, [botId]);
```
**Context**: POST /api/bots/:botId/leave endpoint (timeout handler)  
**Purpose**: Final status update after bot leave delay  
**Parameters**: `botId`  
**Returns**: Update confirmation

## Proposed DatabaseAgent Methods

```javascript
// Bot management operations
async getActiveBots()
async getStuckMeetings()
async forceCompleteMeeting(botId)
async setBotStatusLeaving(botId)
async setBotStatusInactive(botId)

// Generic meeting status updates
async updateMeetingStatus(botId, status)
```

## Domain Classification
- **Primary**: Bot Management
- **Secondary**: Meeting Status Updates
- **Pattern**: Status transitions for bot-managed meetings

## Notes
- All queries target bot meetings (have recall_bot_id)
- Status progression: joining → active → leaving → inactive/completed  
- Proper filtering excludes system meetings
- Recent fix: uses meeting id instead of null recall_bot_id for stuck meetings