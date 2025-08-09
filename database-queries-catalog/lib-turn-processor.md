# lib/turn-processor.js - Query Catalog

## File Summary
- **Purpose**: Turn processing with embedding generation and similarity search
- **Query Count**: 4 queries
- **Main Operations**: Create turns with embeddings, similarity search, embedding statistics

## Query Analysis

### Query 1: Create Turn with Embedding (Line 55)
```javascript
const query = `
  INSERT INTO meetings.turns (
    id,
    user_id,
    content, 
    source_type, 
    source_id, 
    metadata,
    content_embedding,
    meeting_id
  ) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
  RETURNING id, created_at, metadata
`;
```
**Context**: `createTurn` method  
**Purpose**: Insert turn with optional embedding vector  
**Parameters**: `turnId`, `userId`, `content`, `source_type`, `source_id`, `metadata`, `embedding`, `meeting_id`  
**Returns**: Created turn with ID and timestamp

### Query 2: Find Similar Turns (Line 92)
```javascript
const query = `
  WITH target_turn AS (
    SELECT content_embedding, meeting_id
    FROM meetings.turns
    WHERE id = $1
    AND content_embedding IS NOT NULL
  ),
  target_meeting AS (
    SELECT client_id
    FROM meetings.meetings m
    JOIN target_turn tt ON m.id = tt.meeting_id
  )
  SELECT 
    t.id,
    t.content,
    t.source_type,
    t.metadata,
    t.timestamp,
    t.client_id,
    m.client_id,
    -- Get the response if this turn has one
    resp.content as response_content,
    1 - (t.content_embedding <=> tt.content_embedding) as similarity
  FROM meetings.turns t
  CROSS JOIN target_turn tt
  JOIN meetings.meetings m ON t.meeting_id = m.id
  CROSS JOIN target_meeting tm
  LEFT JOIN meetings.turns resp ON resp.source_id = t.id AND resp.source_type LIKE '%llm%'
  WHERE t.id != $1
  AND t.content_embedding IS NOT NULL
  AND m.client_id = tm.client_id  -- Only get turns from same client
  AND 1 - (t.content_embedding <=> tt.content_embedding) >= $3
  ORDER BY similarity DESC
  LIMIT $2
`;
```
**Context**: `findSimilarTurns` method  
**Purpose**: Find semantically similar turns using vector similarity  
**Parameters**: `turnId`, `limit`, `minSimilarity`  
**Returns**: Similar turns with similarity scores and optional responses

### Query 3: Search Turns by Query (Line 144)
```javascript
const query = `
  SELECT 
    id,
    content,
    source_type,
    metadata,
    timestamp,
    1 - (content_embedding <=> $1::vector) as similarity
  FROM turns
  WHERE content_embedding IS NOT NULL
  AND 1 - (content_embedding <=> $1::vector) >= $3
  ORDER BY similarity DESC
  LIMIT $2
`;
```
**Context**: `searchTurns` method  
**Purpose**: Search turns by semantic similarity to query text  
**Parameters**: `embeddingString`, `limit`, `minSimilarity`  
**Returns**: Matching turns with similarity scores  
**Note**: **BUG IDENTIFIED** - Uses `turns` instead of `meetings.turns`

### Query 4: Get Embedding Statistics (Line 167)
```javascript
const query = `
  SELECT 
    COUNT(*) as total_turns,
    COUNT(content) as turns_with_content,
    COUNT(content_embedding) as turns_with_embedding,
    COUNT(CASE WHEN content IS NOT NULL AND content_embedding IS NULL THEN 1 END) as turns_needing_embedding
  FROM turns
`;
```
**Context**: `getEmbeddingStats` method  
**Purpose**: Get statistics on embedding coverage  
**Parameters**: None  
**Returns**: Turn counts and embedding coverage statistics  
**Note**: **BUG IDENTIFIED** - Uses `turns` instead of `meetings.turns`

## Proposed DatabaseAgent Methods

```javascript
// Turn processing operations
async createTurnWithEmbedding(turnData)
async findSimilarTurns(turnId, limit = 10, minSimilarity = 0.7)
async searchTurnsBySimilarity(queryEmbedding, limit = 20, minSimilarity = 0.5)
async getTurnEmbeddingStats()
```

## Domain Classification
- **Primary**: Turn Processing with Embeddings
- **Secondary**: Semantic Similarity Search
- **Pattern**: Vector similarity operations with pgvector

## Notes
- **BUGS IDENTIFIED**: Queries 3 & 4 use `turns` instead of `meetings.turns`
- Uses pgvector extension with `<=>` operator for cosine distance
- Complex CTE for client-scoped similarity search
- Integrates EmbeddingService for vector generation
- Includes response content in similarity results via LEFT JOIN
- Uses UUID generation for turn IDs
- Similarity calculated as `1 - cosine_distance`
- Client isolation ensures searches stay within client boundaries