# server/services/websocket-service.js - Query Catalog

## File Summary
- **Purpose**: WebSocket service for real-time Recall.ai transcript processing
- **Query Count**: 1 query
- **Main Operations**: Look up meeting by recall_bot_id for transcript processing

## Query Analysis

### Query 1: Get Meeting by Bot ID (Line 75)
```javascript
const meetingResult = await this.pool.query(`
  SELECT * 
  FROM meetings.meetings
  WHERE recall_bot_id = $1 AND meeting_type != 'system'
`, [botId]);
```
**Context**: WebSocket transcript processing  
**Purpose**: Find meeting associated with Recall.ai bot for transcript data  
**Parameters**: `botId` (from WebSocket message)  
**Returns**: Meeting record for transcript processing  
**Usage**: Called on every transcript message to get meeting context

## Proposed DatabaseAgent Methods

```javascript
// WebSocket/Bot operations
async getMeetingByBotId(botId)
async findActiveBotMeeting(botId) // Excludes system meetings
```

## Domain Classification
- **Primary**: Real-time Transcript Processing
- **Secondary**: Bot Meeting Association
- **Pattern**: Bot-to-meeting lookup for streaming data

## Notes
- **Previously Fixed**: This was updated from `meetings` to `meetings.meetings` schema
- Core query for real-time transcript processing pipeline
- Excludes system meetings to avoid processing issues
- Used in high-frequency WebSocket message handling
- Part of critical path: Recall.ai → WebSocket → Meeting → Transcript Processing