# Cogito Technical Architecture Report

## Executive Summary

Cogito is a conversational AI system that provides intelligent meeting transcription, real-time chat interaction, and contextual conversation analysis. Built on Node.js with PostgreSQL, it integrates Recall.ai for meeting recording, Claude 3.5 Sonnet for AI responses, and supports both real-time WebSocket connections and HTTP API interactions.

## System Architecture

### Core Components

**Backend Services:**
- **Express.js Server** (`server.js`) - Main application server with dependency injection
- **Database Layer** - PostgreSQL with schema-organized tables (meetings, context, events, client_mgmt)
- **AI Integration** - Claude 3.5 Sonnet for conversational responses and analysis
- **Meeting Integration** - Recall.ai API for bot creation and meeting recording
- **Real-time Communication** - WebSocket service for live transcript streaming

**Frontend:**
- **ClojureScript Single Page Application** - Built with Reagent/Re-frame
- **WebSocket Client** - Real-time transcript display
- **EDN-based API Communication** - Structured data exchange with backend

### Database Schema

**Core Tables:**
- `meetings.meetings` - Meeting metadata, bot IDs, transcript storage
- `meetings.turns` - Conversational turns with embeddings and user context
- `context.files` / `context.chunks` - File upload processing with embeddings
- `events.events` / `event_types` - System logging and error tracking
- `client_mgmt.users` / `clients` - Multi-tenant user authentication

**Key Relationships:**
- Each meeting belongs to a client and is created by a user
- Turns reference meetings and users, contain embeddings for similarity search
- File chunks are linked to clients for contextual retrieval
- Events track system operations and errors with user context

## Technical Implementation Details

### Authentication & Session Management

```javascript
// Session-based authentication with automatic meeting creation
if (req.session && req.session.user) {
  user_id = req.session.user.user_id;
} else if (process.env.NODE_ENV !== 'production') {
  user_id = 1; // Development fallback
}

// Automatic session meeting creation
meeting_id = await createSessionMeeting(req.db, user_id, client_id);
req.session.meeting_id = meeting_id;
```

**Session Meeting Architecture:**
- Every conversational session automatically creates a meeting
- All turns are associated with the session meeting for data integrity
- No orphaned conversational turns - full traceability

### AI Processing Pipeline

**Conversation Flow:**
1. **User Input** → Stored as turn with embedding generation
2. **Context Retrieval** → Semantic search of past conversations and uploaded files
3. **Prompt Building** → Contextual prompt with conversation history and client info
4. **Claude API** → Generate response using Claude 3.5 Sonnet
5. **Response Storage** → Store LLM response as turn with metadata

**Embedding System:**
- Automatic embedding generation for all conversational turns
- Vector similarity search for contextual conversation retrieval
- File chunk processing with embedding-based retrieval

### Meeting Bot Integration

**Recall.ai Integration:**
```javascript
// Bot creation with dual endpoints
const botData = await fetch('https://us-west-2.recall.ai/api/v1/bot/', {
  method: 'POST',
  body: JSON.stringify({
    meeting_url: meeting_url,
    bot_name: 'Cogito',
    recording_config: {
      realtime_endpoints: [
        { type: "websocket", url: websocketUrl, events: ["transcript.data"] },
        { type: "webhook", url: webhookUrl, events: ["participant_events.chat_message"] }
      ]
    }
  })
});
```

**Real-time Processing:**
- WebSocket receives live transcript chunks
- Transcript buffer agent processes speakers and content
- Speaker profile agent identifies users across meetings
- Turn embedding agent generates vector embeddings asynchronously

### Error Handling & Logging

**Database Event Logging:**
```javascript
// Lightweight error logging integration
req.logger?.logError('conversation_error', error, {
  userId: req.session?.user?.user_id,
  sessionId: req.sessionID,
  endpoint: `${req.method} ${req.path}`,
  requestBody: req.body
});
```

**Event Types:**
- `conversation_error` - Failed conversational turns
- `bot_creation_error` - Recall.ai integration failures  
- `webhook_chat_error` - Chat message processing errors
- `meeting_created` - Successful bot/meeting creation

## File Architecture & Modularity

### Small Module Pattern
Following 200-line file size limits for optimal AI comprehension:

```
server/
├── routes/           # HTTP endpoints (~100-150 lines each)
├── services/         # Business logic services
├── lib/             # Utility modules and processors
└── config/          # Configuration and middleware

Key Modules:
- event-logger.js (75 lines) - Database logging utility
- turn-processor.js - Conversational turn processing with embeddings  
- webhook-service.js - Recall.ai webhook processing
- conversation-context.js - Semantic context retrieval
```

### Dependency Injection Pattern

```javascript
// Clean dependency injection in server.js
app.use((req, res, next) => {
  req.pool = pool;
  req.anthropic = anthropic;
  req.fileUploadService = fileUploadService;
  req.turnProcessor = turnProcessor;
  req.logger = eventLogger;  // <- New logging integration
  req.appendToConversation = (...args) => meetingService.appendToConversation(...args);
  next();
});
```

## Data Flow Examples

### Conversational Turn Processing

1. **Input Validation**
   ```javascript
   const { content, context } = req.body;
   // Authentication & session validation
   // Meeting ID retrieval/creation
   ```

2. **Turn Creation**
   ```javascript
   userTurn = await createTurn(req, {
     user_id: user_id,
     content: content,
     source_type: 'conversational-repl-user',
     meeting_id: meeting_id
   });
   ```

3. **Context Building**
   ```javascript
   // Semantic search for similar past conversations
   const similarTurns = await findSimilarTurns(req, userTurn.turn_id, 10, 0.7);
   // File chunk retrieval based on content similarity
   const similarChunks = await findSimilarChunks(pool, embeddingService, content, clientId);
   ```

4. **AI Response Generation**
   ```javascript
   const message = await req.anthropic.messages.create({
     model: "claude-3-5-sonnet-20241022",
     max_tokens: 1000,
     messages: [{ role: "user", content: prompt }]
   });
   ```

### Meeting Bot Workflow

1. **Bot Creation** → Recall.ai API call with WebSocket/webhook endpoints
2. **Meeting Record** → Database storage with UUID, user context, bot ID
3. **Real-time Transcript** → WebSocket receives chunks, processes speakers
4. **Chat Commands** → Webhook processes "?" or "@cogito" messages
5. **AI Analysis** → Context retrieval + Claude API + response sent back to meeting

## Configuration & Environment

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://user:pass@host/db
ANTHROPIC_API_KEY=sk-ant-...
RECALL_API_KEY=9cd175...
RENDER_EXTERNAL_URL=https://your-domain.com  # For production WebSocket URLs
```

**Development vs Production:**
- Development: Automatic user_id=1 fallback, localhost WebSocket URLs
- Production: Full authentication required, external WebSocket URLs

## Performance Considerations

**Embedding Processing:**
- Asynchronous embedding generation to avoid blocking requests
- Vector similarity search with configurable thresholds
- Turn embedding agent processes in background

**Database Optimization:**
- UUID primary keys for distributed architecture
- Indexed embedding vectors for similarity search
- Schema-based table organization for logical separation

**Memory Management:**
- Meeting buffer cleanup on completion/timeout
- Speaker agent cleanup after meeting ends
- Periodic inactive meeting cleanup (5-minute intervals)

## Security & Multi-tenancy

**Client Isolation:**
- All data filtered by client_id where applicable
- Session-based user authentication with client context
- File uploads and chunks isolated per client
- Conversation context restricted to client scope

**Data Privacy:**
- Meeting transcripts stored per client
- User sessions isolated with meeting-specific data
- Error logging captures minimal necessary context

## Deployment Architecture

**Current Setup:**
- **Development Branch** - Active development with full debugging
- **Main Branch** - Production deployment target
- **Render.com Hosting** - PostgreSQL database and Node.js server
- **Automatic Deployment** - Git push to main triggers rebuild

**Migration Strategy:**
- SQL migrations in `migrations/` folder
- Database schema versioning
- Backward-compatible API changes

## Future Extensibility

**Planned Enhancements:**
- Database Access Layer (DAL) for centralized query management
- Comprehensive test suite for database operations  
- Enhanced event logging for system monitoring
- Advanced conversation analysis and pattern detection

**Architecture Benefits:**
- Small, focused modules enable easy AI assistance and debugging
- Clean dependency injection allows easy service replacement
- Schema-organized database supports logical feature separation
- User-centric data model aligns with modern authentication patterns

---

*This technical report reflects the system architecture as of the current development state. The system demonstrates a mature conversational AI platform with real-time capabilities, semantic context retrieval, and robust error handling.*