# Classification System

## Purpose
Intelligent classification system for analyzing conversation content and detecting patterns, client mentions, and interaction types. Provides AI-powered categorization and detection capabilities for enhanced conversation understanding and organization.

## Core Classification Components

### `client-detector.js`
**Purpose**: Client detection and identification from text content
- Detects client mentions in various text contexts (meetings, emails, Slack)
- Searches existing client database for matches
- Creates new client records when appropriate
- Provides intelligent client name extraction and normalization

```javascript
export class ClientDetector {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.debug = false;

    // 1. Initialize specialized processing modules
    this.extractor = new ClientNameExtractor(this.debug);
    this.searcher = new ClientSearcher(this.db);
    this.formatter = new ResultFormatter();
    this.creator = new ClientCreator(this.db);
  }

  async detectClient(text, context = 'general', _options = {}) {
    if (this.debug) console.log(`🔍 Detecting client in: "${text}" (context: ${context})`);
    
    try {
      // 1. Extract potential client names from text using context-aware algorithms
      const candidates = this.extractor.extractClientNames(text, context);
      
      // 2. Handle case where no client names are found
      if (candidates.length === 0) {
        return {
          status: 'no_candidates',
          message: 'No potential client names found in text',
          searched_text: text
        };
      }

      // 3. Search for existing clients in database
      const searchResults = await this.searcher.searchClients(candidates);
      
      // 4. Analyze results and determine appropriate response
      const analysis = this.formatter.analyzeResults(searchResults, candidates);
      
      // 5. Handle client creation if needed
      if (analysis.shouldCreateClient) {
        const newClient = await this.creator.createClientFromCandidates(candidates, context);
        return this.formatter.formatCreationResult(newClient, analysis);
      }
      
      // 6. Return formatted detection results
      return this.formatter.formatDetectionResult(analysis, searchResults);
      
    } catch (error) {
      console.error('Client detection error:', error);
      return {
        status: 'error',
        message: 'Client detection failed',
        error: error.message
      };
    }
  }
  
  async suggestClientCreation(candidates, context) {
    // 1. Validate client creation candidates
    // 2. Check for naming conflicts and duplicates
    // 3. Generate client creation suggestions
    // 4. Return creation recommendations
  }
}
```

### `client-detector/` Subdirectory Components

#### `client-name-extractor.js`
**Purpose**: Context-aware client name extraction from text
- Uses natural language processing to identify potential client names
- Applies context-specific extraction rules
- Handles various text formats and sources
- Filters and ranks extraction candidates

```javascript
export class ClientNameExtractor {
  constructor(debug = false) {
    this.debug = debug;
    this.extractionPatterns = this.initializePatterns();
  }
  
  extractClientNames(text, context) {
    // 1. Apply context-specific extraction rules
    const contextualCandidates = this.applyContextualExtraction(text, context);
    
    // 2. Use pattern matching for common client name formats
    const patternCandidates = this.applyPatternMatching(text);
    
    // 3. Apply NLP-based entity recognition
    const nlpCandidates = this.applyNLPExtraction(text);
    
    // 4. Combine and rank all candidates
    const allCandidates = [...contextualCandidates, ...patternCandidates, ...nlpCandidates];
    
    // 5. Filter and deduplicate candidates
    return this.filterAndRankCandidates(allCandidates);
  }
  
  applyContextualExtraction(text, context) {
    // 1. Apply extraction rules based on context type
    switch (context) {
      case 'meeting':
        return this.extractFromMeetingContext(text);
      case 'email':
        return this.extractFromEmailContext(text);
      case 'slack':
        return this.extractFromSlackContext(text);
      default:
        return this.extractFromGeneralContext(text);
    }
  }
}
```

#### `client-searcher.js`
**Purpose**: Database search for existing clients
- Performs fuzzy matching against existing client names
- Implements similarity scoring and ranking
- Handles variations in client name formatting
- Provides search result confidence scoring

```javascript
export class ClientSearcher {
  constructor(databaseManager) {
    this.db = databaseManager;
  }
  
  async searchClients(candidates) {
    const results = [];
    
    // 1. Search for exact matches first
    for (const candidate of candidates) {
      const exactMatches = await this.searchExactMatch(candidate);
      if (exactMatches.length > 0) {
        results.push(...exactMatches.map(match => ({
          ...match,
          candidate,
          match_type: 'exact',
          confidence: 1.0
        })));
      }
    }
    
    // 2. Search for fuzzy matches if no exact matches
    if (results.length === 0) {
      const fuzzyMatches = await this.searchFuzzyMatches(candidates);
      results.push(...fuzzyMatches);
    }
    
    // 3. Rank results by confidence and relevance
    return this.rankSearchResults(results);
  }
  
  async searchExactMatch(candidateName) {
    // 1. Query database for exact client name matches
    const query = `
      SELECT * FROM client_mgmt.clients 
      WHERE LOWER(name) = LOWER($1)
    `;
    
    const result = await this.db.query(query, [candidateName]);
    return result.rows;
  }
  
  async searchFuzzyMatches(candidates) {
    // 1. Use string similarity algorithms for fuzzy matching
    // 2. Apply phonetic matching for name variations
    // 3. Calculate similarity scores
    // 4. Return ranked fuzzy matches
  }
}
```

#### `result-formatter.js`
**Purpose**: Search result analysis and formatting
- Analyzes search results for decision making
- Formats results for client consumption
- Determines client creation recommendations
- Provides structured response formatting

```javascript
export class ResultFormatter {
  analyzeResults(searchResults, candidates) {
    // 1. Analyze search result quality and confidence
    const highConfidenceResults = searchResults.filter(r => r.confidence >= 0.8);
    const mediumConfidenceResults = searchResults.filter(r => r.confidence >= 0.5 && r.confidence < 0.8);
    
    // 2. Determine if new client creation is recommended
    const shouldCreateClient = highConfidenceResults.length === 0 && 
                              candidates.some(c => this.isValidClientName(c));
    
    // 3. Generate recommendation analysis
    return {
      totalResults: searchResults.length,
      highConfidenceResults,
      mediumConfidenceResults,
      shouldCreateClient,
      bestCandidate: this.selectBestCandidate(candidates),
      analysisConfidence: this.calculateAnalysisConfidence(searchResults, candidates)
    };
  }
  
  formatDetectionResult(analysis, searchResults) {
    // 1. Format successful detection results
    if (analysis.highConfidenceResults.length > 0) {
      return {
        status: 'found',
        client: analysis.highConfidenceResults[0],
        confidence: analysis.highConfidenceResults[0].confidence,
        alternatives: analysis.mediumConfidenceResults
      };
    }
    
    // 2. Format uncertain results with suggestions
    if (analysis.mediumConfidenceResults.length > 0) {
      return {
        status: 'uncertain',
        suggestions: analysis.mediumConfidenceResults,
        recommendation: 'Review suggestions and confirm client selection'
      };
    }
    
    // 3. Format no match results
    return {
      status: 'not_found',
      candidates: analysis.bestCandidate,
      recommendation: 'Consider creating new client or refining search'
    };
  }
}
```

#### `client-creator.js`
**Purpose**: New client creation and validation
- Creates new client records from detected names
- Validates client information before creation
- Handles client creation workflow
- Manages client onboarding process

```javascript
export class ClientCreator {
  constructor(databaseManager) {
    this.db = databaseManager;
  }
  
  async createClientFromCandidates(candidates, context) {
    // 1. Select best candidate for client creation
    const bestCandidate = this.selectCreationCandidate(candidates);
    
    // 2. Validate candidate for client creation
    const validationResult = await this.validateClientCandidate(bestCandidate);
    if (!validationResult.valid) {
      throw new Error(`Invalid client candidate: ${validationResult.reason}`);
    }
    
    // 3. Create client record in database
    const clientData = {
      name: bestCandidate.name,
      context_discovered: context,
      status: 'active',
      created_at: new Date(),
      metadata: {
        extraction_confidence: bestCandidate.confidence,
        original_text: bestCandidate.originalText
      }
    };
    
    // 4. Insert client via DatabaseAgent
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    const newClient = await dbAgent.clients.createClient(clientData);
    
    // 5. Log client creation event
    await this.logClientCreation(newClient, context);
    
    return newClient;
  }
  
  validateClientCandidate(candidate) {
    // 1. Check minimum name length and format
    if (!candidate.name || candidate.name.length < 2) {
      return { valid: false, reason: 'Name too short' };
    }
    
    // 2. Validate name characters and format
    if (!/^[a-zA-Z0-9\s\-&.]+$/.test(candidate.name)) {
      return { valid: false, reason: 'Invalid characters in name' };
    }
    
    // 3. Check for common invalid patterns
    const invalidPatterns = ['test', 'example', 'demo', 'sample'];
    if (invalidPatterns.some(pattern => candidate.name.toLowerCase().includes(pattern))) {
      return { valid: false, reason: 'Name contains test/demo patterns' };
    }
    
    return { valid: true };
  }
}
```

### `interaction-classifier.js`
**Purpose**: Conversation interaction classification and analysis
- Classifies conversation turns by interaction type
- Detects planning, thinking, and milestone patterns
- Provides conversation flow analysis
- Identifies conversation phase transitions

```javascript
export class InteractionClassifier {
  constructor() {
    this.filters = {
      thinking: new ThinkingDetector(),
      planning: new PlanningDetector(),
      milestone: new MilestoneDetector(),
      interaction: new InteractionFilter()
    };
  }
  
  async classifyTurn(turnContent, conversationContext) {
    try {
      // 1. Apply each classification filter
      const classifications = await Promise.all([
        this.filters.thinking.detectThinking(turnContent, conversationContext),
        this.filters.planning.detectPlanning(turnContent, conversationContext),
        this.filters.milestone.detectMilestone(turnContent, conversationContext),
        this.filters.interaction.filterInteraction(turnContent, conversationContext)
      ]);
      
      // 2. Combine classification results
      const combinedResult = this.combineClassifications(classifications);
      
      // 3. Determine primary classification
      const primaryType = this.determinePrimaryType(combinedResult);
      
      // 4. Return structured classification
      return {
        primary_type: primaryType,
        confidence: combinedResult.confidence,
        details: combinedResult,
        turn_content: turnContent,
        classification_timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Turn classification error:', error);
      return {
        primary_type: 'unknown',
        confidence: 0.0,
        error: error.message
      };
    }
  }
  
  combineClassifications(classifications) {
    // 1. Weight each classification type
    const weights = {
      thinking: 0.3,
      planning: 0.3,
      milestone: 0.25,
      interaction: 0.15
    };
    
    // 2. Calculate weighted confidence scores
    const weightedScores = classifications.map((classification, index) => ({
      type: Object.keys(weights)[index],
      score: classification.confidence * weights[Object.keys(weights)[index]],
      details: classification
    }));
    
    // 3. Return combined analysis
    return {
      scores: weightedScores,
      confidence: Math.max(...weightedScores.map(s => s.score)),
      details: classifications
    };
  }
}
```

### `interaction-classifier/` Subdirectory Components

#### `thinking-detector.js`
**Purpose**: Detection of reflective and analytical thinking patterns
- Identifies contemplative and analytical conversation turns
- Detects problem-solving and reflection patterns
- Recognizes metacognitive expressions
- Provides thinking pattern analysis

#### `planning-detector.js`
**Purpose**: Detection of planning and strategic discussion patterns
- Identifies forward-looking and planning conversations
- Detects goal-setting and strategy discussions
- Recognizes project planning patterns
- Provides planning phase analysis

#### `milestone-detector.js`
**Purpose**: Detection of achievement and milestone patterns
- Identifies completion and achievement discussions
- Detects progress updates and status reports
- Recognizes celebration and recognition patterns
- Provides milestone tracking analysis

#### `interaction-filter.js`
**Purpose**: General interaction pattern filtering and analysis
- Filters conversation turns by interaction quality
- Identifies meaningful vs. administrative exchanges
- Recognizes conversation flow patterns
- Provides interaction significance scoring

## Classification Integration Patterns

### Classification Pipeline
```javascript
export class ClassificationPipeline {
  constructor(databaseManager) {
    this.clientDetector = new ClientDetector(databaseManager);
    this.interactionClassifier = new InteractionClassifier();
  }
  
  async processConversationTurn(turnData, conversationContext) {
    // 1. Classify interaction type
    const interactionClassification = await this.interactionClassifier.classifyTurn(
      turnData.content, 
      conversationContext
    );
    
    // 2. Detect client mentions
    const clientDetection = await this.clientDetector.detectClient(
      turnData.content,
      conversationContext.type || 'general'
    );
    
    // 3. Combine classification results
    return {
      turn_id: turnData.id,
      interaction_type: interactionClassification.primary_type,
      interaction_confidence: interactionClassification.confidence,
      client_detection: clientDetection,
      classification_metadata: {
        processed_at: new Date(),
        context: conversationContext,
        classifications: interactionClassification.details
      }
    };
  }
}
```

## Database Integration

### Classification Storage Operations
```javascript
export class ClassificationOperations {
  async storeClassificationResults(turnId, classificationResults) {
    // 1. Store classification results via DatabaseAgent
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    // 2. Update turn with classification metadata
    const updateResult = await dbAgent.turns.updateTurnClassification(turnId, {
      interaction_type: classificationResults.interaction_type,
      classification_confidence: classificationResults.interaction_confidence,
      classification_metadata: classificationResults.classification_metadata
    });
    
    // 3. Store client detection results if found
    if (classificationResults.client_detection.status === 'found') {
      await dbAgent.turns.updateTurnClientAssociation(turnId, 
        classificationResults.client_detection.client.id
      );
    }
    
    return updateResult;
  }
}
```

## Performance Optimization

### Classification Caching
```javascript
export class ClassificationCache {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  getCachedClassification(contentHash) {
    // 1. Check cache for existing classification
    const cached = this.cache.get(contentHash);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.classification;
    }
    
    return null;
  }
  
  cacheClassification(contentHash, classification) {
    // 1. Store classification in cache with timestamp
    this.cache.set(contentHash, {
      classification,
      timestamp: Date.now()
    });
  }
}
```

## Testing Strategies

### Classification System Testing
```javascript
describe('Classification System', () => {
  test('client detector finds existing clients', async () => {
    const detector = new ClientDetector(mockDatabase);
    const result = await detector.detectClient('Meeting with Acme Corp about project', 'meeting');
    
    expect(result.status).toBe('found');
    expect(result.client).toHaveProperty('name');
  });
  
  test('interaction classifier identifies thinking patterns', async () => {
    const classifier = new InteractionClassifier();
    const result = await classifier.classifyTurn(
      'I think we need to reconsider our approach to this problem',
      { type: 'conversation', meeting_id: 'test-123' }
    );
    
    expect(result.primary_type).toBe('thinking');
    expect(result.confidence).toBeGreaterThan(0.5);
  });
  
  test('client name extractor finds candidates', () => {
    const extractor = new ClientNameExtractor();
    const candidates = extractor.extractClientNames(
      'Working with Microsoft on Azure integration',
      'email'
    );
    
    expect(candidates).toContain('Microsoft');
  });
});
```