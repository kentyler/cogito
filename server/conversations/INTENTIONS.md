# Conversation System

## Purpose
Core conversation processing system that handles LLM interactions, context building, prompt construction, and turn management. Provides the foundation for AI-powered conversations with context awareness and intelligent response generation.

## Architecture Philosophy
- **Context-Aware**: Builds rich conversation context from history, files, and user data
- **LLM-Agnostic**: Supports multiple LLM providers with unified interface
- **Modular Processing**: Separates concerns across focused modules
- **DatabaseAgent Integration**: All data operations through consistent interface
- **Streaming Support**: Real-time response streaming to clients

## Core System Files

### `llm-handler.js`
**Purpose**: Main LLM interaction orchestrator
- Coordinates LLM provider selection and configuration
- Manages request routing to appropriate LLM providers
- Handles response processing and formatting
- Provides unified interface for all LLM operations

```javascript
export class LLMHandler {
  async generateResponse(prompt, userContext, clientConfig) {
    // 1. Determine appropriate LLM provider based on user/client settings
    // 2. Build provider-specific request configuration
    // 3. Execute LLM request with error handling and retries
    // 4. Process and format LLM response
    // 5. Handle streaming response if requested
    // 6. Return formatted response with metadata
  }
  
  async streamResponse(prompt, userContext, responseStream) {
    // 1. Initialize streaming LLM request
    // 2. Process response chunks as they arrive
    // 3. Format and emit chunks to response stream
    // 4. Handle stream completion and cleanup
  }
}
```

### `context-builder.js`
**Purpose**: Conversation context aggregation and preparation
- Builds comprehensive context from multiple sources
- Manages context size and relevance optimization
- Handles context caching and performance
- Integrates conversation history, files, and user data

```javascript
export class ContextBuilder {
  async buildConversationContext(userId, clientId, meetingId, currentTurn) {
    // 1. Fetch recent conversation history via DatabaseAgent
    // 2. Retrieve relevant file chunks via semantic search
    // 3. Include user and client context information
    // 4. Optimize context size for LLM limits
    // 5. Format context for LLM consumption
    // 6. Return structured context object
  }
  
  async optimizeContextSize(context, maxTokens) {
    // 1. Calculate token usage for context components
    // 2. Prioritize context relevance and recency
    // 3. Trim less relevant content to fit limits
    // 4. Maintain conversation coherence
  }
}
```

### `llm-prompt-builder.js`
**Purpose**: Prompt construction and formatting
- Builds structured prompts from context and user input
- Handles prompt templates and customization
- Manages system prompts and instructions
- Optimizes prompt structure for different LLM providers

```javascript
export class LLMPromptBuilder {
  buildPrompt(userMessage, context, systemInstructions) {
    // 1. Structure system prompt with instructions and context
    // 2. Format conversation history for continuity
    // 3. Include relevant file context and references
    // 4. Add user message as final prompt component
    // 5. Optimize prompt structure for target LLM
    // 6. Return formatted prompt ready for LLM
  }
  
  formatSystemPrompt(instructions, clientConfig, userPreferences) {
    // 1. Load base system instructions
    // 2. Apply client-specific customizations
    // 3. Include user preference modifications
    // 4. Format for optimal LLM comprehension
  }
}
```

### `turn-handler.js`
**Purpose**: Individual turn processing and management
- Processes user turns and generates responses
- Manages turn storage and metadata
- Handles turn validation and preprocessing
- Coordinates with embedding generation

```javascript
export class TurnHandler {
  async processTurn(turnData, conversationContext) {
    // 1. Validate turn data and user permissions
    // 2. Store user turn via DatabaseAgent
    // 3. Generate LLM response using context
    // 4. Store assistant response via DatabaseAgent
    // 5. Generate embeddings for both turns
    // 6. Return complete turn processing result
  }
  
  async validateTurnData(turnData, userContext) {
    // 1. Validate required turn fields
    // 2. Check user permissions and access
    // 3. Verify meeting context exists
    // 4. Sanitize turn content
  }
}
```

### `llm-config.js`
**Purpose**: LLM configuration and provider management
- Manages LLM provider configurations
- Handles model availability and capabilities
- Provides LLM validation and selection logic
- Manages provider-specific settings

```javascript
export async function isValidLLM(llmId, dbConnection) {
  // 1. Query LLM configuration via DatabaseAgent
  // 2. Validate LLM is active and available
  // 3. Check provider connectivity
  // 4. Return validation result
}

export async function updateUserSelectedLLM(dbConnection, userId, llmId) {
  // 1. Validate LLM selection for user
  // 2. Update user preferences via DatabaseAgent
  // 3. Clear cached configurations
  // 4. Log configuration change
}
```

### `conversation-context.js`
**Purpose**: Context management and retrieval coordination
- Coordinates context building from multiple sources
- Manages context caching and performance
- Handles context relevance scoring
- Provides context debugging and inspection

```javascript
export class ConversationContext {
  async getFullContext(userId, clientId, meetingId, options = {}) {
    // 1. Initialize context builders
    // 2. Fetch conversation history
    // 3. Retrieve relevant file content
    // 4. Include user and client context
    // 5. Score and rank context relevance
    // 6. Return optimized context
  }
  
  async updateContextCache(meetingId, context) {
    // 1. Store context in cache with expiration
    // 2. Index context for quick retrieval
    // 3. Manage cache size and cleanup
  }
}
```

### `conversation-context/` Subdirectory

#### `chunk-finder.js`
**Purpose**: Semantic search for relevant content chunks
- Performs embedding-based similarity search
- Finds relevant file chunks for conversation context
- Manages search ranking and filtering
- Handles chunk relevance scoring

```javascript
export class ChunkFinder {
  async findRelevantChunks(query, userId, clientId, limit = 5) {
    // 1. Generate embedding for search query
    // 2. Perform vector similarity search via DatabaseAgent
    // 3. Filter results by user/client access
    // 4. Score and rank chunk relevance
    // 5. Return top relevant chunks with metadata
  }
}
```

#### `context-formatter.js`
**Purpose**: Context formatting and structuring for LLM consumption
- Formats context components into coherent structure
- Handles different LLM provider requirements
- Manages context readability and organization
- Optimizes context for token efficiency

```javascript
export class ContextFormatter {
  formatForLLM(context, provider, options = {}) {
    // 1. Structure context based on provider requirements
    // 2. Format conversation history chronologically
    // 3. Organize file context by relevance
    // 4. Apply formatting optimizations
    // 5. Return provider-ready context
  }
}
```

## LLM Integration Patterns

### Provider Abstraction
```javascript
export class LLMProvider {
  async generateResponse(prompt, config) {
    // Provider-specific implementation
    throw new Error('generateResponse must be implemented by provider');
  }
  
  async streamResponse(prompt, config, callback) {
    // Provider-specific streaming implementation
    throw new Error('streamResponse must be implemented by provider');
  }
}

export class AnthropicProvider extends LLMProvider {
  async generateResponse(prompt, config) {
    // 1. Format prompt for Anthropic API
    // 2. Make API request with configuration
    // 3. Handle response and extract content
    // 4. Return formatted response
  }
}
```

### Configuration Management
```javascript
export class LLMConfigurationManager {
  getProviderConfig(providerId, userPreferences, clientSettings) {
    return {
      model: this.selectModel(providerId, clientSettings),
      temperature: Math.min(
        userPreferences.temperature || 0.7,
        clientSettings.maxTemperature || 1.0
      ),
      maxTokens: Math.min(
        userPreferences.maxTokens || 2000,
        clientSettings.maxTokens || 4000
      ),
      systemPrompt: this.buildSystemPrompt(clientSettings, userPreferences)
    };
  }
}
```

## Database Integration

### Conversation Operations (via DatabaseAgent)
- `turnOperations.createTurn(turnData)` - Store conversation turns
- `turnOperations.getMeetingTurns(meetingId, limit)` - Get conversation history
- `turnOperations.updateTurn(turnId, updates)` - Update turn metadata

### Context Operations (via DatabaseAgent)
- `fileOperations.getFileChunks(fileId)` - Get file content for context
- `searchOperations.semanticSearch(query, userId, clientId)` - Find relevant content
- `contextOperations.cacheContext(contextData)` - Cache context for reuse

### LLM Configuration (via DatabaseAgent)
- `llmOperations.getLLMById(llmId)` - Get LLM configuration
- `llmOperations.getAvailableLLMs(clientId)` - Get accessible models
- `userOperations.updateLLMPreference(userId, llmId)` - Update user LLM choice

## Context Building Pipeline

### 1. History Context
```javascript
async buildHistoryContext(meetingId, turnLimit = 20) {
  const turns = await this.dbAgent.turnOperations
    .getMeetingTurns(meetingId, turnLimit);
  
  return turns.map(turn => ({
    role: turn.role,
    content: turn.content_text,
    timestamp: turn.created_at,
    metadata: turn.metadata
  }));
}
```

### 2. File Context
```javascript
async buildFileContext(query, userId, clientId) {
  const relevantChunks = await this.chunkFinder
    .findRelevantChunks(query, userId, clientId, 5);
  
  return relevantChunks.map(chunk => ({
    source: chunk.file_name,
    content: chunk.content,
    relevance_score: chunk.similarity_score,
    context_type: 'file_reference'
  }));
}
```

### 3. User Context
```javascript
async buildUserContext(userId, clientId) {
  const user = await this.dbAgent.userOperations.getUserById(userId);
  const client = await this.dbAgent.clientOperations.getClientById(clientId);
  
  return {
    user: {
      name: user.name,
      preferences: user.preferences
    },
    client: {
      name: client.name,
      settings: client.settings
    }
  };
}
```

## Error Handling Patterns

### LLM Error Handling
```javascript
async handleLLMError(error, context) {
  if (error.code === 'RATE_LIMITED') {
    // Wait and retry with exponential backoff
    return await this.retryWithBackoff(() => 
      this.generateResponse(context)
    );
  }
  
  if (error.code === 'CONTEXT_TOO_LONG') {
    // Reduce context size and retry
    const reducedContext = await this.contextBuilder
      .optimizeContextSize(context, context.maxTokens * 0.8);
    return await this.generateResponse(reducedContext);
  }
  
  // Log error and return appropriate response
  console.error('LLM generation error:', error);
  throw new ConversationError('Failed to generate response', error);
}
```

### Context Building Errors
```javascript
async safeContextBuilding(contextSources) {
  const results = await Promise.allSettled([
    this.buildHistoryContext(contextSources.meetingId),
    this.buildFileContext(contextSources.query, contextSources.userId, contextSources.clientId),
    this.buildUserContext(contextSources.userId, contextSources.clientId)
  ]);
  
  const context = {};
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      context[this.contextTypes[index]] = result.value;
    } else {
      console.warn(`Context building failed for ${this.contextTypes[index]}:`, result.reason);
      context[this.contextTypes[index]] = this.getDefaultContext(this.contextTypes[index]);
    }
  });
  
  return context;
}
```

## Performance Optimization

### Context Caching
```javascript
export class ContextCache {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async getOrBuild(key, builder) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const data = await builder();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

### Streaming Optimization
```javascript
export class ResponseStreamer {
  async streamLLMResponse(llmStream, clientStream) {
    try {
      for await (const chunk of llmStream) {
        const processedChunk = this.processChunk(chunk);
        clientStream.write(processedChunk);
      }
      clientStream.end();
    } catch (error) {
      clientStream.destroy(error);
    }
  }
}
```

## Testing Strategies

### Unit Testing
- Mock LLM providers for consistent testing
- Test context building with various scenarios
- Validate prompt construction accuracy
- Test error handling and recovery

### Integration Testing
- End-to-end conversation flows
- LLM provider integration testing
- Database operations validation
- Context relevance verification

### Performance Testing
- Context building speed optimization
- LLM response time monitoring
- Memory usage in streaming scenarios
- Concurrent conversation handling