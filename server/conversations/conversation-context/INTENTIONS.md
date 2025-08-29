# Conversation Context Components

## Purpose
Specialized modules for building, finding, and formatting conversation context. These components work together to provide rich, relevant context for LLM interactions through semantic search and intelligent content organization.

## Core Components

### `chunk-finder.js`
**Purpose**: Semantic search and content chunk retrieval
- Performs embedding-based similarity search for relevant content
- Finds file chunks that relate to current conversation context
- Manages search result ranking and relevance scoring
- Handles user/client access permissions for content

```javascript
export class ChunkFinder {
  async findRelevantChunks(query, userId, clientId, options = {}) {
    // 1. Generate embedding for the search query
    // 2. Execute vector similarity search via DatabaseAgent
    // 3. Filter results by user and client access permissions
    // 4. Score chunks by relevance and recency
    // 5. Apply result limits and thresholds
    // 6. Return ranked chunks with metadata and scores
  }
  
  async findSimilarContent(turnContent, meetingId, excludeTurnId) {
    // 1. Generate embedding for turn content
    // 2. Search for similar turns within meeting context
    // 3. Find related file chunks across user's accessible content
    // 4. Combine and rank all similar content
    // 5. Return deduplicated similar content list
  }
  
  async findFileChunksForContext(fileIds, query, limit = 10) {
    // 1. Validate file access permissions
    // 2. Search within specific files for relevant chunks
    // 3. Rank chunks by query relevance
    // 4. Include file metadata and source information
    // 5. Return formatted chunk list for context
  }
}
```

### `context-formatter.js`
**Purpose**: Context structuring and formatting for LLM consumption
- Formats context components into coherent, readable structure
- Handles different LLM provider formatting requirements
- Manages context organization and token optimization
- Provides template-based context structuring

```javascript
export class ContextFormatter {
  formatForLLM(contextData, providerType, options = {}) {
    // 1. Structure context based on LLM provider requirements
    // 2. Organize conversation history chronologically
    // 3. Group file context by source and relevance
    // 4. Apply provider-specific formatting rules
    // 5. Optimize for token efficiency and readability
    // 6. Return formatted context ready for LLM
  }
  
  formatConversationHistory(turns, maxTurns = 20) {
    // 1. Sort turns chronologically
    // 2. Format each turn with role and content
    // 3. Include timestamp and metadata where relevant
    // 4. Apply turn limit with intelligent truncation
    // 5. Maintain conversation flow and context
    // 6. Return formatted conversation history
  }
  
  formatFileContext(chunks, options = {}) {
    // 1. Group chunks by source file
    // 2. Order by relevance score
    // 3. Include source attribution and metadata
    // 4. Format content for optimal LLM comprehension
    // 5. Add context markers and separators
    // 6. Return structured file context
  }
  
  optimizeContextSize(formattedContext, maxTokens) {
    // 1. Estimate token usage for each context component
    // 2. Prioritize content by importance and relevance
    // 3. Intelligently trim less critical content
    // 4. Maintain context coherence and completeness
    // 5. Ensure essential information is preserved
    // 6. Return size-optimized context
  }
}
```

## Integration Patterns

### Semantic Search Integration
```javascript
export class SemanticSearchCoordinator {
  constructor(dbAgent, embeddingService) {
    this.dbAgent = dbAgent;
    this.embeddingService = embeddingService;
    this.chunkFinder = new ChunkFinder(dbAgent);
  }
  
  async findContextualContent(query, userContext, options = {}) {
    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    
    // 2. Search for similar content across multiple sources
    const [fileChunks, similarTurns, relatedMeetings] = await Promise.all([
      this.chunkFinder.findRelevantChunks(query, userContext.userId, userContext.clientId),
      this.findSimilarTurns(queryEmbedding, userContext.meetingId),
      this.findRelatedMeetings(queryEmbedding, userContext.userId)
    ]);
    
    // 3. Combine and rank all contextual content
    return this.combineAndRankContent(fileChunks, similarTurns, relatedMeetings);
  }
}
```

### Context Building Pipeline
```javascript
export class ContextBuildingPipeline {
  async buildFullContext(conversationRequest) {
    const contextComponents = await this.gatherContextComponents(conversationRequest);
    const formattedContext = await this.formatContext(contextComponents);
    const optimizedContext = await this.optimizeContext(formattedContext);
    
    return optimizedContext;
  }
  
  async gatherContextComponents(request) {
    const { userId, clientId, meetingId, currentMessage } = request;
    
    // Gather context from multiple sources in parallel
    const [
      conversationHistory,
      fileContext,
      similarContent,
      userPreferences
    ] = await Promise.allSettled([
      this.getConversationHistory(meetingId),
      this.chunkFinder.findRelevantChunks(currentMessage, userId, clientId),
      this.findSimilarConversations(currentMessage, userId),
      this.getUserContextPreferences(userId)
    ]);
    
    return {
      history: conversationHistory.status === 'fulfilled' ? conversationHistory.value : [],
      files: fileContext.status === 'fulfilled' ? fileContext.value : [],
      similar: similarContent.status === 'fulfilled' ? similarContent.value : [],
      preferences: userPreferences.status === 'fulfilled' ? userPreferences.value : {}
    };
  }
}
```

## Database Integration

### Search Operations (via DatabaseAgent)
- `searchOperations.vectorSimilaritySearch(embedding, options)` - Vector-based content search
- `searchOperations.textSearch(query, filters)` - Text-based content search
- `searchOperations.hybridSearch(query, embedding, weights)` - Combined search approach

### File Operations (via DatabaseAgent)
- `fileOperations.getAccessibleChunks(userId, clientId)` - Get user's accessible content
- `fileOperations.getFileChunks(fileId, options)` - Get chunks from specific file
- `fileOperations.searchFileChunks(fileId, query)` - Search within file

### Context Cache Operations
- `contextOperations.cacheSearchResults(key, results, ttl)` - Cache search results
- `contextOperations.getCachedResults(key)` - Retrieve cached results
- `contextOperations.invalidateCache(patterns)` - Clear relevant cache entries

## Performance Optimization

### Search Result Caching
```javascript
export class SearchResultCache {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async getCachedOrSearch(searchKey, searchFunction) {
    const cached = this.cache.get(searchKey);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.results;
    }
    
    const results = await searchFunction();
    this.cache.set(searchKey, {
      results: results,
      timestamp: Date.now()
    });
    
    return results;
  }
  
  generateSearchKey(query, userId, clientId, options) {
    return `search:${userId}:${clientId}:${this.hashQuery(query)}:${JSON.stringify(options)}`;
  }
}
```

### Batch Processing
```javascript
export class BatchContextProcessor {
  async processBatchChunks(chunks, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(chunk => this.processChunk(chunk))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  async processChunk(chunk) {
    // 1. Validate chunk access permissions
    // 2. Format chunk content for context
    // 3. Calculate relevance scores
    // 4. Add metadata and source information
    return {
      content: chunk.content,
      source: chunk.file_name,
      relevance: chunk.similarity_score,
      metadata: chunk.metadata
    };
  }
}
```

## Security and Access Control

### Permission Validation
```javascript
export class ContextSecurityManager {
  async validateChunkAccess(chunk, userId, clientId) {
    // 1. Check if user has access to source file
    const fileAccess = await this.dbAgent.fileOperations
      .checkFileAccess(chunk.file_id, userId, clientId);
    
    if (!fileAccess) {
      return false;
    }
    
    // 2. Check client-specific content restrictions
    const clientRestrictions = await this.dbAgent.clientOperations
      .getContentRestrictions(clientId);
    
    if (this.violatesRestrictions(chunk, clientRestrictions)) {
      return false;
    }
    
    return true;
  }
  
  async filterSecureContent(chunks, userContext) {
    const filteredChunks = [];
    
    for (const chunk of chunks) {
      const hasAccess = await this.validateChunkAccess(
        chunk,
        userContext.userId,
        userContext.clientId
      );
      
      if (hasAccess) {
        filteredChunks.push(this.sanitizeChunkContent(chunk));
      }
    }
    
    return filteredChunks;
  }
}
```

## Error Handling

### Search Error Recovery
```javascript
export class ContextErrorHandler {
  async handleSearchError(error, fallbackOptions) {
    console.error('Context search error:', error);
    
    switch (error.type) {
      case 'EMBEDDING_GENERATION_FAILED':
        // Fall back to text-based search
        return await this.performTextSearch(fallbackOptions);
        
      case 'VECTOR_SEARCH_TIMEOUT':
        // Use cached results if available
        return await this.getCachedResults(fallbackOptions) || [];
        
      case 'PERMISSION_DENIED':
        // Return empty results with appropriate logging
        this.logSecurityEvent(error, fallbackOptions);
        return [];
        
      default:
        // Return minimal context to keep conversation functional
        return await this.getMinimalContext(fallbackOptions);
    }
  }
  
  async getMinimalContext(options) {
    // Return basic conversation history without file context
    try {
      return await this.dbAgent.turnOperations
        .getMeetingTurns(options.meetingId, 5);
    } catch (error) {
      console.error('Failed to get minimal context:', error);
      return [];
    }
  }
}
```

## Content Relevance Scoring

### Relevance Algorithms
```javascript
export class RelevanceScorer {
  calculateChunkRelevance(chunk, query, context) {
    const scores = {
      semantic: chunk.similarity_score || 0,
      recency: this.calculateRecencyScore(chunk.created_at),
      usage: this.calculateUsageScore(chunk.access_count),
      contextual: this.calculateContextualScore(chunk, context)
    };
    
    // Weighted combination of scores
    return (
      scores.semantic * 0.4 +
      scores.recency * 0.2 +
      scores.usage * 0.2 +
      scores.contextual * 0.2
    );
  }
  
  calculateRecencyScore(createdAt) {
    const daysSinceCreation = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    return Math.exp(-daysSinceCreation / 30); // Exponential decay over 30 days
  }
  
  calculateContextualScore(chunk, context) {
    // Score based on relevance to current meeting topic, user patterns, etc.
    let score = 0;
    
    if (context.meetingTopic && chunk.content.includes(context.meetingTopic)) {
      score += 0.3;
    }
    
    if (context.recentKeywords) {
      const matchingKeywords = context.recentKeywords.filter(keyword =>
        chunk.content.toLowerCase().includes(keyword.toLowerCase())
      );
      score += matchingKeywords.length * 0.1;
    }
    
    return Math.min(score, 1.0);
  }
}
```

## Testing Strategies

### Component Testing
- Mock embedding service for consistent search results
- Test chunk filtering with various permission scenarios
- Validate context formatting for different LLM providers
- Test relevance scoring algorithms with known data

### Integration Testing
- End-to-end context building pipeline testing
- Search result accuracy validation
- Performance testing with large datasets
- Permission boundary testing

### Performance Testing
- Search response time optimization
- Context building speed with various data sizes
- Memory usage monitoring during batch processing
- Cache effectiveness measurement