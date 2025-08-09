# server/services/transcript-service.js - Query Catalog

## File Summary
- **Purpose**: Real-time transcript processing with buffer management and speaker profiling
- **Query Count**: 0 queries (delegates all database operations to agents)
- **Main Operations**: Coordinate transcript buffer agents and speaker profile agents

## Query Analysis

**No direct database queries found in this service.**

This service acts as a coordination layer that:
- Manages `TranscriptBufferAgent` instances per meeting
- Manages `SpeakerProfileAgent` instances per meeting  
- Coordinates the flow: transcript chunk → speaker profiling → turn embedding
- Handles lifecycle management (start/end processing per meeting)

## Database Operations (Delegated)

All database operations are delegated to:
- **`TranscriptBufferAgent`** - Turn creation and storage
- **`SpeakerProfileAgent`** - User identification and profile management
- **`TurnEmbeddingAgent`** - Turn embedding generation and storage

## Proposed DatabaseAgent Methods

This service would use existing methods from other agents:
```javascript
// Used by coordinated agents
// TranscriptBufferAgent.processTurn() -> DatabaseAgent.createTurn()
// SpeakerProfileAgent.processSpeaker() -> DatabaseAgent.getUserByProfile()
// TurnEmbeddingAgent.processTurn() -> DatabaseAgent.updateTurnEmbedding()
```

## Domain Classification
- **Primary**: Transcript Processing Coordination
- **Secondary**: Agent Lifecycle Management
- **Pattern**: Service orchestration without direct database access

## Notes
- Pure coordination service - no direct database queries
- Manages memory buffers for real-time processing
- Proper cleanup of agents when meetings end
- Default client_id fallback to 6 (cogito client)
- Handles async flow from raw transcript to stored, embedded turns