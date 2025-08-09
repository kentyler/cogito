# lib/fragment-extraction-agent.cjs - Query Catalog

## File Summary
- **Purpose**: Extract Theory of Constraints (TOC) elements from conversation turns
- **Query Count**: 4 queries
- **Main Operations**: Save fragments, process session turns, retrieve session fragments

## Query Analysis

### Query 1: Save Fragment (Line 190)
```javascript
await this.pool.query(`
  INSERT INTO thinking_tools.tree_fragments 
  (fragment_id, client_id, session_id, originating_turn_id, fragment_type, 
   toc_element_type, label, description, evidence, confidence, metadata)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
`, [
  fragmentId,
  clientId,
  sessionId, 
  turnId,
  fragment.fragment_type,
  fragment.toc_element_type,
  fragment.label,
  fragment.description,
  fragment.evidence,
  fragment.confidence,
  JSON.stringify({
    extracted_at: new Date().toISOString(),
    extraction_method: 'pattern_matching'
  })
]);
```
**Context**: `saveFragment` method  
**Purpose**: Store extracted TOC fragment with metadata  
**Parameters**: 11 parameters including IDs, fragment details, confidence score  
**Returns**: Fragment ID

### Query 2: Get Recent Turns (Line 230)
```javascript
let query = `
  SELECT turn_id, content, source_type 
  FROM meetings.turns 
  WHERE client_id = $1
`;
// Additional filtering logic...
query += ` ORDER BY created_at DESC LIMIT 20`;
```
**Context**: `processSessionTurns` method  
**Purpose**: Get recent turns for fragment extraction  
**Parameters**: `clientId`  
**Returns**: Recent turns for processing

### Query 3: Get Specific Turns (Line 244)
```javascript
query = `
  SELECT turn_id, content, source_type 
  FROM meetings.turns 
  WHERE client_id = $1 AND turn_id = ANY($2)
`;
```
**Context**: `processSessionTurns` method  
**Purpose**: Get specific turns by ID for processing  
**Parameters**: `clientId`, `turnIds` (array)  
**Returns**: Specified turns for processing

### Query 4: Get Session Fragments (Line 302)
```javascript
const result = await this.pool.query(`
  SELECT fragment_id, toc_element_type, label, confidence, created_at
  FROM thinking_tools.tree_fragments 
  WHERE client_id = $1 AND session_id = $2
  ORDER BY created_at DESC
`, [clientId, sessionId]);
```
**Context**: `getSessionFragments` method  
**Purpose**: Retrieve all fragments for a session  
**Parameters**: `clientId`, `sessionId`  
**Returns**: Session fragments ordered by creation time

## Proposed DatabaseAgent Methods

```javascript
// Fragment extraction operations
async saveTreeFragment(fragmentData)
async getRecentTurnsForProcessing(clientId, limit = 20)
async getTurnsByIds(clientId, turnIds)
async getSessionFragments(clientId, sessionId)
```

## Domain Classification
- **Primary**: Theory of Constraints Analysis
- **Secondary**: Pattern Extraction
- **Pattern**: NLP pattern matching with confidence scoring

## Notes
- Specialized agent for TOC element extraction
- Uses regex patterns for identifying TOC elements (conflicts, obstacles, needs, etc.)
- Confidence scoring based on text characteristics
- Stores fragments in `thinking_tools.tree_fragments` schema
- Pattern-based extraction with 8 TOC element types
- CommonJS module (`.cjs`) for compatibility
- Includes debug logging for traceability
- Processes turns in batches for efficiency