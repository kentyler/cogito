# lib/turn-embedding-agent/turn-storage.js - Query Catalog

## File Summary
- **Purpose**: Database storage operations for processed conversation turns
- **Query Count**: 2 queries
- **Main Operations**: Store turns with embeddings, get processing statistics

## Query Analysis

### Query 1: Store Turn with Embedding (Line 18)
```javascript
const query = `
  INSERT INTO meetings.turns (
    id,
    meeting_id,
    client_id,
    user_id,
    content,
    content_embedding,
    meeting_index,
    metadata,
    timestamp
  ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING id, created_at
`;
```
**Context**: `storeTurn` method  
**Purpose**: Store processed conversation turn with embedding vector  
**Parameters**: `meetingId`, `clientId`, `user_id`, `content`, `embedding`, `meetingIndex`, `metadata`, `timestamp`  
**Returns**: Generated turn ID and creation timestamp

### Query 2: Get Processing Statistics (Line 66)
```javascript
const query = `
  SELECT 
    COUNT(*) as total_turns,
    COUNT(content_embedding) as turns_with_embeddings,
    COUNT(*) - COUNT(content_embedding) as turns_without_embeddings,
    AVG(LENGTH(content)) as avg_content_length,
    MIN(meeting_index) as first_turn_index,
    MAX(meeting_index) as last_turn_index
  FROM meetings.turns 
  WHERE meeting_id = $1
`;
```
**Context**: `getProcessingStats` method  
**Purpose**: Get embedding processing statistics for a meeting  
**Parameters**: `meetingId`  
**Returns**: Turn counts, embedding stats, content length averages

## Proposed DatabaseAgent Methods

```javascript
// Turn storage operations
async storeTurnWithEmbedding(turn)
async getMeetingProcessingStats(meetingId)
```

## Domain Classification
- **Primary**: Turn Storage
- **Secondary**: Embedding Management
- **Pattern**: High-volume turn insertion with analytics

## Notes
- **Previously Fixed**: This was updated to use shared pool instead of separate DatabaseAgent
- **Previously Fixed**: Bug in getProcessingStats was corrected (WHERE meeting_id vs WHERE id)
- Hybrid approach: uses pool if available, falls back to DatabaseAgent
- Uses PostgreSQL gen_random_uuid() for ID generation
- Handles optional user_id for speaker identification
- JSON storage for flexible metadata
- Key component in real-time transcript processing pipeline