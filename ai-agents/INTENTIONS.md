# AI Agents System

## Purpose
AI-powered agent system for specialized processing tasks including game state tracking, speaker profiling, turn processing, and transcript buffering. Provides intelligent analysis and processing capabilities for conversation enhancement and pattern recognition.

## Core AI Agent Components

### `game-state-agent.js`
**Purpose**: Design games integration and game state tracking
- Tracks game state progression during conversations
- Integrates with design games system for collaborative design processes
- Monitors state changes and transitions during design sessions
- Provides game state context for conversation processing

```javascript
export class GameStateAgent {
  async processTurn(_sessionId, _content, _clientId) {
    // 1. Analyze turn content for game state indicators
    // 2. Determine if current game state has changed
    // 3. Check if explicit state declaration is needed
    // 4. Return structured game state information
    return {
      currentState: { type: 'undeclared' },
      stateChanged: false,
      needsStateDeclaration: false
    };
  }
  
  async updateGameState(sessionId, newState, clientId) {
    // 1. Validate new game state against known patterns
    // 2. Update session game state via DatabaseAgent
    // 3. Log state transition for analysis
    // 4. Notify relevant systems of state change
    // 5. Return updated game state confirmation
  }
  
  async getGameHistory(sessionId, clientId) {
    // 1. Retrieve game state history for session
    // 2. Format state transitions chronologically
    // 3. Include transition triggers and context
    // 4. Return comprehensive game history
  }
}

export const gameStateAgent = new GameStateAgent();
```

### `game-state-agent/` Subdirectory Components

#### `game-loader.js`
**Purpose**: Game configuration and initialization management
- Loads available design games and their configurations
- Manages game rules and state transition logic
- Handles game-specific processing parameters
- Provides game metadata and capabilities

#### `session-manager.js`
**Purpose**: Game session lifecycle and state persistence
- Creates and manages game sessions
- Persists game state across conversation turns
- Handles session cleanup and archival
- Manages concurrent game sessions for multiple clients

#### `state-detector.js`
**Purpose**: Intelligent game state detection from conversation content
- Analyzes conversation content for state indicators
- Detects implicit state transitions from user interactions
- Identifies explicit state declarations and confirmations
- Provides confidence scoring for state detection

### `speaker-profile-agent.js`
**Purpose**: Speaker identification and profiling
- Identifies speakers in conversation transcripts
- Builds speaker profiles based on communication patterns
- Tracks speaker characteristics and preferences
- Provides speaker context for conversation processing

```javascript
export class SpeakerProfileAgent {
  async processTranscriptSegment(transcriptSegment, meetingId) {
    // 1. Extract speaker indicators from transcript
    // 2. Match against existing speaker profiles
    // 3. Update or create speaker profile data
    // 4. Generate speaker insights and characteristics
    // 5. Return speaker identification results
  }
  
  async buildSpeakerProfile(speakerId, conversationHistory) {
    // 1. Analyze communication patterns and style
    // 2. Identify topic preferences and expertise areas
    // 3. Extract personality indicators and traits
    // 4. Build comprehensive speaker profile
    // 5. Store profile via DatabaseAgent
  }
  
  async identifySpeaker(turnContent, availableProfiles) {
    // 1. Compare turn characteristics against known profiles
    // 2. Calculate similarity scores and confidence levels
    // 3. Apply speaker identification algorithms
    // 4. Return most likely speaker match with confidence
  }
}
```

### `speaker-profile-agent/` Subdirectory Components

#### `profile-generator.js`
**Purpose**: AI-powered speaker profile creation
- Generates detailed speaker profiles from conversation data
- Extracts communication patterns and preferences
- Identifies expertise areas and knowledge domains
- Creates personality and behavioral profiles

#### `profile-storage.js`
**Purpose**: Speaker profile persistence and retrieval
- Stores speaker profiles in database
- Manages profile versioning and updates
- Provides efficient profile lookup and matching
- Handles profile privacy and access control

#### `speaker-identifier.js`
**Purpose**: Real-time speaker identification algorithms
- Implements speaker matching algorithms
- Processes real-time speaker identification
- Manages speaker disambiguation in group conversations
- Provides confidence scoring for identifications

### `transcript-buffer-agent.js`
**Purpose**: Transcript buffering and processing coordination
- Manages transcript data buffering during processing
- Coordinates between transcript input and processing systems
- Handles streaming transcript data and chunking
- Provides transcript processing pipeline management

```javascript
export class TranscriptBufferAgent {
  async bufferTranscriptSegment(segment, meetingId) {
    // 1. Add transcript segment to processing buffer
    // 2. Check if buffer is ready for processing
    // 3. Apply segmentation and chunking logic
    // 4. Trigger processing when conditions are met
    // 5. Return buffering status and next actions
  }
  
  async processBufferedTranscripts() {
    // 1. Retrieve ready transcript segments from buffer
    // 2. Apply transcript processing algorithms
    // 3. Generate speaker profiles and embeddings
    // 4. Store processed results via DatabaseAgent
    // 5. Clear processed segments from buffer
  }
  
  async flushBuffer(meetingId) {
    // 1. Process remaining buffered segments
    // 2. Complete any pending processing tasks
    // 3. Store final processing results
    // 4. Clean up buffer resources
  }
}
```

### `turn-embedding-agent.js`
**Purpose**: Turn embedding generation and management
- Generates embeddings for conversation turns
- Manages embedding processing pipelines
- Handles embedding storage and retrieval
- Provides embedding-based search capabilities

```javascript
export class TurnEmbeddingAgent {
  async generateTurnEmbedding(turnContent, turnMetadata) {
    // 1. Preprocess turn content for embedding
    // 2. Generate embedding using configured provider
    // 3. Apply embedding normalization and optimization
    // 4. Store embedding with turn association
    // 5. Return embedding generation results
  }
  
  async batchProcessEmbeddings(turns) {
    // 1. Prepare turns for batch embedding generation
    // 2. Process embeddings in optimized batches
    // 3. Handle failed embeddings with retry logic
    // 4. Store all embeddings via DatabaseAgent
    // 5. Return batch processing summary
  }
  
  async findSimilarTurns(queryEmbedding, clientId, limit = 10) {
    // 1. Perform vector similarity search
    // 2. Filter results by client access permissions
    // 3. Score and rank similar turns
    // 4. Include turn context and metadata
    // 5. Return ranked similar turns
  }
}
```

### `turn-embedding-agent/` Subdirectory Components

#### `embedding-retry-handler.js`
**Purpose**: Robust embedding generation with retry logic
- Handles embedding generation failures
- Implements intelligent retry strategies
- Manages rate limiting and service availability
- Provides fallback embedding methods

#### `turn-storage.js`
**Purpose**: Turn and embedding persistence management
- Stores turns with associated embeddings
- Manages embedding indexing for search
- Handles embedding updates and versioning
- Provides efficient embedding retrieval

### `turn-processor.js`
**Purpose**: Core turn processing orchestration
- Coordinates turn processing across multiple agents
- Manages turn processing pipeline and workflow
- Handles turn validation and preprocessing
- Provides turn processing status and results

```javascript
export class TurnProcessor {
  async processTurn(turnData, conversationContext) {
    // 1. Validate turn data and conversation context
    // 2. Apply preprocessing and normalization
    // 3. Coordinate processing across specialized agents
    // 4. Generate embeddings and speaker profiles
    // 5. Update game state if applicable
    // 6. Store processed turn results
    // 7. Return comprehensive processing results
  }
  
  async processTranscriptBatch(turns, meetingId) {
    // 1. Prepare turns for batch processing
    // 2. Process turns in parallel where possible
    // 3. Maintain conversation order and context
    // 4. Handle processing errors gracefully
    // 5. Return batch processing summary
  }
}
```

## AI Agent Integration Patterns

### Agent Coordination
```javascript
export class AIAgentCoordinator {
  constructor() {
    this.gameStateAgent = new GameStateAgent();
    this.speakerProfileAgent = new SpeakerProfileAgent();
    this.transcriptBufferAgent = new TranscriptBufferAgent();
    this.turnEmbeddingAgent = new TurnEmbeddingAgent();
    this.turnProcessor = new TurnProcessor();
  }
  
  async processConversationTurn(turnData, context) {
    // 1. Coordinate turn processing across all agents
    const results = await Promise.allSettled([
      this.gameStateAgent.processTurn(context.sessionId, turnData.content, context.clientId),
      this.speakerProfileAgent.processTranscriptSegment(turnData, context.meetingId),
      this.turnEmbeddingAgent.generateTurnEmbedding(turnData.content, turnData.metadata),
      this.transcriptBufferAgent.bufferTranscriptSegment(turnData, context.meetingId)
    ]);
    
    // 2. Aggregate and return processing results
    return this.aggregateProcessingResults(results);
  }
}
```

### Database Integration
```javascript
export class AIAgentDatabaseOperations {
  async storeGameState(sessionId, gameState, clientId) {
    // 1. Store game state via DatabaseAgent
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    const result = await dbAgent.gameOperations.updateGameState(sessionId, gameState, clientId);
    return result;
  }
  
  async storeSpeakerProfile(profileData) {
    // 1. Store speaker profile with proper access controls
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    const result = await dbAgent.speakerOperations.createOrUpdateProfile(profileData);
    return result;
  }
  
  async storeEmbeddings(turnId, embedding, metadata) {
    // 1. Store turn embeddings for search
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    const result = await dbAgent.turnOperations.storeEmbedding(turnId, embedding, metadata);
    return result;
  }
}
```

## Agent Configuration and Management

### Agent Configuration Structure
```javascript
{
  gameStateAgent: {
    enabled: boolean,
    gameTypes: [string],
    stateTransitionThresholds: object,
    sessionTimeout: number
  },
  speakerProfileAgent: {
    enabled: boolean,
    minSegmentLength: number,
    confidenceThreshold: number,
    profileUpdateFrequency: string
  },
  turnEmbeddingAgent: {
    enabled: boolean,
    embeddingProvider: string,
    batchSize: number,
    retryAttempts: number
  },
  transcriptBufferAgent: {
    enabled: boolean,
    bufferSize: number,
    flushInterval: number,
    processingTrigger: string
  }
}
```

### Performance Optimization
```javascript
export class AIAgentOptimizer {
  async optimizeBatchProcessing(agents, processingQueue) {
    // 1. Analyze processing queue for optimization opportunities
    // 2. Group similar processing tasks together
    // 3. Distribute processing across available agents
    // 4. Monitor processing performance and adjust
    // 5. Return optimization results and metrics
  }
  
  async cacheAgentResults(agentType, cacheKey, results, ttl = 300000) {
    // 1. Cache agent processing results for reuse
    // 2. Set appropriate cache expiration
    // 3. Handle cache invalidation on data updates
    // 4. Provide cache hit/miss metrics
  }
}
```

## Error Handling and Recovery

### Agent Error Management
```javascript
export class AIAgentErrorHandler {
  handleAgentError(agentName, error, context) {
    // 1. Log agent error with full context
    console.error(`AI Agent Error [${agentName}]:`, {
      error: error.message,
      context,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // 2. Determine error recovery strategy
    switch (error.type) {
      case 'EMBEDDING_SERVICE_UNAVAILABLE':
        return this.retryWithBackoff(agentName, context);
        
      case 'GAME_STATE_INVALID':
        return this.resetGameState(context.sessionId);
        
      case 'SPEAKER_PROFILE_CONFLICT':
        return this.resolveProfileConflict(context);
        
      default:
        return this.defaultErrorRecovery(agentName, error, context);
    }
  }
}
```

## Testing Strategies

### AI Agent Testing
```javascript
describe('AI Agents System', () => {
  test('game state agent tracks state changes', async () => {
    const agent = new GameStateAgent();
    const result = await agent.processTurn('session123', 'starting design phase', 'client456');
    
    expect(result).toHaveProperty('currentState');
    expect(result).toHaveProperty('stateChanged');
    expect(result).toHaveProperty('needsStateDeclaration');
  });
  
  test('speaker profile agent identifies speakers', async () => {
    const agent = new SpeakerProfileAgent();
    const segment = {
      content: 'Hello everyone, this is John speaking.',
      timestamp: new Date(),
      metadata: {}
    };
    
    const result = await agent.processTranscriptSegment(segment, 'meeting123');
    
    expect(result).toHaveProperty('speakerId');
    expect(result).toHaveProperty('confidence');
  });
  
  test('turn embedding agent generates embeddings', async () => {
    const agent = new TurnEmbeddingAgent();
    const embedding = await agent.generateTurnEmbedding('test content', {});
    
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing
```javascript
describe('AI Agent Integration', () => {
  test('coordinator processes turns across all agents', async () => {
    const coordinator = new AIAgentCoordinator();
    const turnData = { content: 'test turn', metadata: {} };
    const context = { sessionId: 'session123', clientId: 'client456', meetingId: 'meeting789' };
    
    const results = await coordinator.processConversationTurn(turnData, context);
    
    expect(results).toHaveProperty('gameState');
    expect(results).toHaveProperty('speakerProfile');
    expect(results).toHaveProperty('embedding');
    expect(results).toHaveProperty('bufferStatus');
  });
});
```