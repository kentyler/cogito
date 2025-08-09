# lib/database-agent/transcript-processor.js - Query Catalog

## File Summary
- **Purpose**: Transcript processing coordination with flexible filtering
- **Query Count**: 1 query (delegates other operations)
- **Main Operations**: Get transcripts with dynamic filtering, coordinate import/analysis

## Query Analysis

### Query 1: Get Meeting Transcripts (Line 68)
```javascript
const query = `
  SELECT 
    m.id,
    m.name as meeting_name,
    m.meeting_type,
    t.id,
    ${contentField}
    t.source_type,
    t.metadata,
    t.timestamp,
    t.created_at
  FROM meetings m
  JOIN meetings.turns t ON m.id = t.id
  ${whereClause}
  ORDER BY t.timestamp, t.id
  LIMIT $${paramIndex++} OFFSET $${paramIndex++}
`;
```
**Context**: `getMeetingTranscripts` method  
**Purpose**: Flexible transcript retrieval with multiple filter options  
**Parameters**: Optional `meetingId`, `clientId`, `sourceType`, `startDate`, `endDate`, `limit`, `offset`  
**Returns**: Filtered transcript turns with meeting context  
**Note**: **BUG IDENTIFIED** - JOIN uses `m.id = t.id` instead of `m.id = t.meeting_id`

## Database Operations (Delegated)

Other operations delegate to specialized modules:
```javascript
// Import operations → TranscriptImporter
async importTranscript(options)

// Analysis operations → TranscriptAnalyzer
async analyzeTranscript(meetingId)
```

## Proposed DatabaseAgent Methods

```javascript
// Transcript retrieval
async getMeetingTranscripts(options = {})
// Other methods handled by sub-modules
```

## Domain Classification
- **Primary**: Transcript Processing
- **Secondary**: Dynamic Query Building
- **Pattern**: Coordinator with specialized sub-modules

## Notes
- **BUG IDENTIFIED**: JOIN condition uses `t.id` instead of `t.meeting_id`
- Dynamic WHERE clause building with parameterized queries
- Optional content field inclusion for performance optimization
- Delegates complex operations to TranscriptImporter and TranscriptAnalyzer
- Supports date range filtering for temporal analysis
- Pagination with LIMIT/OFFSET for large result sets