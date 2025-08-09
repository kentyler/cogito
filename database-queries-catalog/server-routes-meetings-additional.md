# server/routes/meetings-additional.js - Query Catalog

## File Summary
- **Purpose**: Additional meeting operations (create conversation meetings)
- **Query Count**: 1 query
- **Main Operations**: Create new conversation meetings for REPL

## Query Analysis

### Query 1: Create Conversation Meeting (Line 48)
```javascript
const meetingResult = await req.db.query(
  `INSERT INTO meetings (name, description, meeting_type, created_by_user_id, client_id, metadata) 
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
  [
    meeting_name,
    `Conversation meeting created on ${new Date().toISOString()}`,
    'conversation',
    user_id,
    client_id,
    { source: 'conversational-repl' }
  ]
);
```
**Context**: POST /api/meetings/create endpoint  
**Purpose**: Create new conversation meeting for chat interface  
**Parameters**: `meeting_name`, `user_id`, `client_id`  
**Returns**: Complete meeting record  
**Note**: Uses incorrect table name - should be `meetings.meetings`

## Proposed DatabaseAgent Methods

```javascript
// Meeting creation
async createConversationMeeting(name, userId, clientId, metadata = {})
```

## Domain Classification
- **Primary**: Meeting Creation
- **Secondary**: Conversation REPL
- **Pattern**: INSERT with metadata

## Notes
- **BUG IDENTIFIED**: Query uses `meetings` table instead of `meetings.meetings`
- Auto-generates description with timestamp
- Uses specific meeting_type 'conversation'
- Includes metadata about source (conversational-repl)
- Two other endpoints delegate to similarity orchestrator (no direct queries)