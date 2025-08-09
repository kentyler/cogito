# server/routes/browser-capture.js - Query Catalog

## File Summary
- **Purpose**: Capture browser AI conversations from extension
- **Query Count**: 4 queries
- **Main Operations**: Check existing meeting, create meeting, create user/AI turns

## Query Analysis

### Query 1: Check Existing Meeting (Line 30)
```javascript
let meetingResult = await req.db.query(
  'SELECT id FROM meetings.meetings WHERE name = $1 AND meeting_type = $2',
  [`${platform} Session ${sessionId}`, 'browser_conversation']
);
```
**Context**: POST /api/browser-capture/capture-browser-conversation endpoint  
**Purpose**: Check if meeting already exists for this browser session  
**Parameters**: `platform`, `sessionId` (combined into name)  
**Returns**: Existing meeting id or empty result

### Query 2: Create New Meeting (Line 39)
```javascript
await req.db.query(`
  INSERT INTO meetings.meetings (meeting_id, name, description, meeting_type, metadata, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
`, [
  newMeetingId,
  `${platform} Session ${sessionId}`,
  `Browser conversation session on ${platform} started at ${new Date().toISOString()}`,
  'browser_conversation',
  JSON.stringify({ 
    sessionId, 
    platform, 
    url, 
    ...metadata 
  })
]);
```
**Context**: POST /api/browser-capture/capture-browser-conversation endpoint  
**Purpose**: Create new meeting for browser session if none exists  
**Parameters**: `meeting_id`, `name`, `description`, `meeting_type`, `metadata`  
**Returns**: Insert confirmation

### Query 3: Insert User Turn (Line 65)
```javascript
await req.db.query(`
  INSERT INTO meetings.turns (turn_id, content, source_type, metadata, timestamp, meeting_id, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, NOW())
`, [
  userTurnId, 
  userPrompt, 
  'user_input', 
  JSON.stringify({ sessionId, platform, url }),
  timestamp || new Date().toISOString(),
  meetingId
]);
```
**Context**: POST /api/browser-capture/capture-browser-conversation endpoint  
**Purpose**: Record user's prompt/question  
**Parameters**: `turn_id`, `content`, `source_type`, `metadata`, `timestamp`, `meeting_id`  
**Returns**: Insert confirmation

### Query 4: Insert AI Turn (Line 79)
```javascript
await req.db.query(`
  INSERT INTO meetings.turns (turn_id, content, source_type, metadata, timestamp, meeting_id, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, NOW())
`, [
  aiTurnId, 
  responseContent, 
  `${platform}_response`, 
  JSON.stringify({ sessionId, platform, url, ...metadata }),
  new Date(aiTimestamp).toISOString(),
  meetingId
]);
```
**Context**: POST /api/browser-capture/capture-browser-conversation endpoint  
**Purpose**: Record AI's response  
**Parameters**: `turn_id`, `content`, `source_type`, `metadata`, `timestamp`, `meeting_id`  
**Returns**: Insert confirmation

## Proposed DatabaseAgent Methods

```javascript
// Browser conversation capture
async findOrCreateBrowserMeeting(platform, sessionId, metadata = {})
async createBrowserTurn(meetingId, content, sourceType, metadata = {}, timestamp = null)
async captureBrowserConversation(platform, sessionId, userPrompt, aiResponse, metadata = {})
```

## Domain Classification
- **Primary**: Browser Extension Integration
- **Secondary**: Conversation Capture
- **Pattern**: Session-based meeting creation with paired turns

## Notes
- Creates meetings per browser session (platform + sessionId)
- Uses UUIDs for meeting and turn IDs
- Ensures proper turn ordering with timestamp adjustment (+1ms for AI response)
- Handles both `aiResponse` and `claudeResponse` fields for backwards compatibility
- Stores rich metadata including URL, platform, session info
- No client_id association - appears to be anonymous capture