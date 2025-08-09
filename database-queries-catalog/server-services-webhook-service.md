# server/services/webhook-service.js - Query Catalog

## File Summary
- **Purpose**: Process chat messages from Recall.ai webhooks with context retrieval
- **Query Count**: 4 queries
- **Main Operations**: Find meeting by bot, get transcript context, check meeting files, get uploaded file metadata

## Query Analysis

### Query 1: Find Meeting by Bot ID (Line 31)
```javascript
const meetingResult = await this.db.query(`
  SELECT * 
  FROM meetings.meetings
  WHERE recall_bot_id = $1 AND meeting_type != 'system'
`, [botId]);
```
**Context**: `findMeetingByBot` method  
**Purpose**: Find meeting associated with Recall.ai bot for webhook processing  
**Parameters**: `botId`  
**Returns**: Meeting record for chat message processing

### Query 2: Get Conversation Context (Line 68)
```javascript
const conversationResult = await this.db.query(
  'SELECT full_transcript FROM meetings.meetings WHERE id = $1',
  [meetingId]
);
```
**Context**: `getConversationContext` method  
**Purpose**: Get full transcript for AI context when responding to chat  
**Parameters**: `meetingId`  
**Returns**: Full transcript JSON array for conversation context

### Query 3: Get Meeting File IDs (Line 90)
```javascript
const meetingFileIds = await this.db.query(`
  SELECT file_upload_id FROM meeting_files 
  WHERE meeting_id = $1
`, [meetingId]);
```
**Context**: `getRelevantFileContent` method  
**Purpose**: Get file IDs associated with meeting for semantic search filtering  
**Parameters**: `meetingId`  
**Returns**: List of file_upload_ids for context filtering

### Query 4: Get Uploaded File Metadata (Line 126)
```javascript
const uploadedFiles = await this.db.query(`
  SELECT f.filename, f.metadata->>'description' as description
  FROM context.files f
  JOIN meetings.meeting_files mf ON mf.file_id = f.id
  WHERE mf.meeting_id = $1
`, [meetingId]);
```
**Context**: `getUploadedFilesContext` method  
**Purpose**: Get uploaded file metadata for meeting summary context  
**Parameters**: `meetingId`  
**Returns**: File metadata for context building

## Proposed DatabaseAgent Methods

```javascript
// Webhook processing operations
async findMeetingByBotId(botId)                    // Same as WebSocket service
async getMeetingTranscript(meetingId)              // Same as MeetingService  
async getMeetingFileIds(meetingId)
async getMeetingUploadedFiles(meetingId)
```

## Domain Classification
- **Primary**: Webhook Processing
- **Secondary**: Context Retrieval for AI Responses
- **Pattern**: Bot-to-meeting lookup + rich context building

## Notes
- **Previously Fixed**: Updated from `meetings` to `meetings.meetings` schema
- Shares query pattern with WebSocketService (meeting by bot ID)
- Rich context building for AI responses including files and transcript
- Uses legacy `meeting_files` table with `file_upload_id` (vs newer `context.files`)
- Integrates with FileUploadService for semantic search
- Prevents infinite loops by detecting messages from 'Cogito'