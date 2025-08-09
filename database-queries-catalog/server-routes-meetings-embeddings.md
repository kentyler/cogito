# server/routes/meetings-embeddings.js - Query Catalog

## File Summary
- **Purpose**: Semantic map visualization using turn embeddings
- **Query Count**: 1 query
- **Main Operations**: Get turn embeddings for 2D visualization

## Query Analysis

### Query 1: Get Meeting Turn Embeddings (Line 13)
```javascript
const query = `
  SELECT 
    t.id,
    t.content,
    t.participant_id,
    t.created_at,
    t.source_type,
    p.name as participant_name,
    t.content_embedding
  FROM meetings.turns t
  LEFT JOIN participants p ON t.participant_id = p.id
  WHERE t.id = $1
    AND t.content_embedding IS NOT NULL
  ORDER BY t.created_at
`;

const result = await req.db.query(query, [meetingId]);
```
**Context**: GET /api/meetings/:meetingId/embeddings endpoint  
**Purpose**: Get turns with embeddings for semantic visualization  
**Parameters**: `meetingId` (from URL params)  
**Returns**: Turns with embedding vectors for 2D projection  
**Note**: Currently has bug - uses `t.id = $1` instead of `t.meeting_id = $1`

## Proposed DatabaseAgent Methods

```javascript
// Embedding visualization
async getMeetingEmbeddings(meetingId)
async getTurnsWithEmbeddings(meetingId) // Fixed version
```

## Domain Classification
- **Primary**: Semantic Visualization
- **Secondary**: Turn Embeddings
- **Pattern**: Vector data for clustering/projection

## Notes
- **BUG IDENTIFIED**: Query uses `t.id = $1` but should use `t.meeting_id = $1`
- Complex client-side processing of embedding vectors
- Handles multiple embedding formats (string, array, pgvector)
- Performs PCA-like dimension reduction for 2D coordinates
- Would benefit from database-side embedding processing