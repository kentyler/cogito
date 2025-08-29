# Meeting Routes

## Purpose
HTTP endpoints for meeting management, CRUD operations, and meeting-related functionality. Handles meeting lifecycle, metadata management, transcript processing, and meeting data retrieval.

## Core Route Files

### `crud.js`
**Purpose**: Basic meeting CRUD (Create, Read, Update, Delete) operations
- GET `/meetings` - List user's meetings with pagination and filtering
- GET `/meetings/:meetingId` - Get specific meeting details
- POST `/meetings` - Create new meeting
- PUT `/meetings/:meetingId` - Update meeting metadata
- DELETE `/meetings/:meetingId` - Delete meeting and associated data

```javascript
// List meetings with stats and pagination
router.get('/meetings', async (req, res) => {
  // 1. Validate user authentication and client context
  // 2. Extract pagination and filter parameters
  // 3. Query meetings via DatabaseAgent with aggregated stats
  // 4. Return formatted meeting list with metadata
});

// Get specific meeting details
router.get('/meetings/:meetingId', async (req, res) => {
  // 1. Validate user access to specific meeting
  // 2. Fetch meeting details via DatabaseAgent
  // 3. Include turn counts, participant info, metadata
  // 4. Return comprehensive meeting information
});

// Delete meeting with cascading cleanup
router.delete('/meetings/:meetingId', async (req, res) => {
  // 1. Validate user owns the meeting
  // 2. Use DatabaseAgent transaction for cascading delete
  // 3. Remove associated turns, files, embeddings
  // 4. Log deletion event and return confirmation
});
```

### `additional.js`
**Purpose**: Extended meeting functionality and specialized operations
- Meeting transcript processing
- Meeting summary generation
- Meeting search and filtering
- Meeting analytics and reporting

```javascript
// Generate meeting summary
router.post('/meetings/:meetingId/summary', async (req, res) => {
  // 1. Validate meeting access and summary permissions
  // 2. Fetch meeting turns and content via DatabaseAgent
  // 3. Generate AI-powered summary via LLM integration
  // 4. Store and return summary data
});

// Search meetings by content
router.get('/meetings/search', async (req, res) => {
  // 1. Extract search query and parameters
  // 2. Perform semantic search via DatabaseAgent
  // 3. Include relevance scoring and context
  // 4. Return ranked search results
});
```

## Meeting Data Models

### Meeting Structure
```javascript
{
  id: string, // UUID
  name: string,
  type: 'meeting' | 'cogito_web' | 'browser_capture',
  user_id: number,
  client_id: number,
  bot_id: string, // For external meeting integrations
  transcript_url: string,
  status: 'active' | 'completed' | 'processing',
  metadata: {
    platform: string,
    duration: number,
    participant_count: number,
    created_at: Date,
    updated_at: Date
  },
  stats: {
    turn_count: number,
    total_turns: number,
    last_activity: Date
  }
}
```

### Meeting Types

#### `meeting`
- External meeting recordings (Recall.ai, Zoom, etc.)
- Has bot_id and transcript_url
- Processed from webhook data
- Contains multiple participants

#### `cogito_web`
- Web interface conversation sessions
- Created automatically on user login/client selection
- Single user conversations with AI
- Session-based meeting association

#### `browser_capture`
- Conversations captured from browser extension
- External AI conversations (Claude, ChatGPT)
- Imported conversation data
- Converted to internal format

## Database Integration

### Meeting Operations (via DatabaseAgent)
- `meetingOperations.createMeeting(meetingData)` - Create new meeting
- `meetingOperations.getMeetingById(meetingId)` - Fetch meeting details
- `meetingOperations.getUserMeetings(userId, clientId)` - List user meetings
- `meetingOperations.updateMeeting(meetingId, updates)` - Update meeting data
- `meetingOperations.deleteMeetingWithCascade(meetingId)` - Delete with cleanup

### Turn Operations (via DatabaseAgent)
- `turnOperations.getMeetingTurns(meetingId)` - Get meeting conversation
- `turnOperations.getTurnCount(meetingId)` - Get turn statistics
- `turnOperations.deleteTurnsByMeeting(meetingId)` - Cleanup turns

### Search Operations (via DatabaseAgent)
- `searchOperations.searchMeetingContent(query, userId, clientId)` - Content search
- `searchOperations.similarMeetings(meetingId)` - Find related meetings

## Request/Response Patterns

### Meeting List Request
```javascript
GET /meetings?page=1&limit=20&type=meeting&search=query

// Response
{
  "meetings": [
    {
      "id": string,
      "name": string,
      "type": string,
      "created_at": Date,
      "stats": {
        "turn_count": number,
        "last_activity": Date
      }
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "has_more": boolean
  }
}
```

### Meeting Creation Request
```javascript
POST /meetings
{
  "name": string,
  "type": "meeting",
  "bot_id": string,
  "metadata": {
    "platform": string,
    "duration": number
  }
}

// Response
{
  "success": true,
  "meeting": {
    "id": string,
    "name": string,
    "type": string,
    "created_at": Date
  }
}
```

### Meeting Deletion Request
```javascript
DELETE /meetings/:meetingId

// Response
{
  "success": true,
  "message": "Meeting deleted successfully",
  "deleted": {
    "meeting_id": string,
    "turns_deleted": number,
    "files_deleted": number
  }
}
```

## Security Patterns

### Access Control
- User authentication verification
- Meeting ownership validation
- Client context verification
- Resource access boundaries

### Data Protection
- Meeting data isolation by client
- User privacy protection
- Sensitive meeting content handling
- Audit logging for meeting operations

### Permission Validation
```javascript
async function validateMeetingAccess(req, meetingId) {
  const userId = req.session?.user?.user_id;
  const clientId = req.session?.client_id;
  
  if (!userId || !clientId) {
    throw new Error('Authentication required');
  }
  
  const meeting = await dbAgent.meetingOperations.getMeetingById(meetingId);
  
  if (!meeting || meeting.user_id !== userId || meeting.client_id !== clientId) {
    throw new Error('Access denied');
  }
  
  return meeting;
}
```

## Error Handling

### Meeting Not Found
- Invalid meeting ID → 404 Not Found
- Deleted meeting access → 404 Not Found with explanation

### Access Denied
- Meeting belongs to different user → 403 Forbidden
- Meeting belongs to different client → 403 Forbidden
- Missing authentication → 401 Unauthorized

### Validation Errors
- Invalid meeting data → 400 Bad Request with validation details
- Missing required fields → 400 Bad Request with field requirements
- Invalid meeting type → 400 Bad Request with supported types

### Database Errors
- Meeting creation failures → 500 Internal Server Error
- Cascade delete failures → 500 Internal Server Error with cleanup status
- Query timeout errors → 504 Gateway Timeout

## Integration Points

### Bot Creation System
- Meeting creation from bot webhook data
- Meeting status updates from external platforms
- Transcript URL processing and storage

### Conversation System
- Session meeting creation for web conversations
- Turn association with meetings
- Meeting context for conversation history

### File System
- Meeting-associated file uploads
- File context within meeting conversations
- File cleanup during meeting deletion

### Search System
- Meeting content indexing and search
- Semantic similarity between meetings
- Meeting discovery and recommendations

## Performance Considerations

### Meeting List Optimization
- Efficient pagination queries
- Aggregated statistics calculation
- Index optimization for common queries
- Caching for frequently accessed meetings

### Cascade Delete Performance
- Transaction-based cleanup operations
- Batch deletion for large datasets
- Progress tracking for long operations
- Timeout handling for complex deletions

### Search Performance
- Semantic search index maintenance
- Query optimization and caching
- Result ranking and relevance
- Search result pagination

## Testing Strategies

### CRUD Testing
- Meeting creation with various data types
- Meeting list filtering and pagination
- Meeting update validation
- Cascade delete verification

### Security Testing
- Access control boundary testing
- Cross-user meeting access attempts
- Authentication requirement validation
- Data isolation verification

### Integration Testing
- Bot integration meeting creation
- Session meeting lifecycle testing
- Search functionality integration
- File association testing

### Performance Testing
- Large meeting list performance
- Complex cascade delete timing
- Search query optimization
- Concurrent access handling