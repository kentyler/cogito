# server/services/meeting-service.js - Query Catalog

## File Summary
- **Purpose**: Coordination layer for meeting operations (mostly delegates to sub-services)
- **Query Count**: 2 queries
- **Main Operations**: Append to conversation timeline (legacy approach)

## Query Analysis

### Query 1: Get Current Transcript (Line 41)
```javascript
const currentResult = await this.pool.query(
  'SELECT full_transcript FROM meetings.meetings WHERE id = $1',
  [meetingId]
);
```
**Context**: `appendToConversation` method  
**Purpose**: Get existing full_transcript JSON to append new content  
**Parameters**: `meetingId`  
**Returns**: Current transcript array or null

### Query 2: Update Full Transcript (Line 65)
```javascript
await this.pool.query(
  'UPDATE meetings.meetings SET full_transcript = $1, updated_at = NOW() WHERE id = $2',
  [JSON.stringify(transcript), meetingId]
);
```
**Context**: `appendToConversation` method  
**Purpose**: Update meeting with new transcript entry  
**Parameters**: `transcript` (JSON array), `meetingId`  
**Returns**: Update confirmation

## Proposed DatabaseAgent Methods

```javascript
// Legacy conversation timeline operations
async getMeetingTranscript(meetingId)
async updateMeetingTranscript(meetingId, transcript)
async appendToConversationTimeline(meetingId, content) // Combines both queries
```

## Domain Classification
- **Primary**: Meeting Coordination
- **Secondary**: Legacy Transcript Timeline
- **Pattern**: Service orchestration with simple data operations

## Notes
- **Previously Fixed**: Updated from `meetings` to `meetings.meetings` schema
- Mostly delegates to specialized sub-services (TranscriptService, EmailService, CleanupService)
- `appendToConversation` is legacy approach - modern processing uses transcript agents
- Handles JSON array manipulation for conversation timeline
- Service acts as coordination layer rather than doing heavy data processing