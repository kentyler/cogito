# server/routes/transcripts.js - Query Catalog

## File Summary
- **Purpose**: Transcript browsing by date
- **Query Count**: 2 queries
- **Main Operations**: List dates with turn counts, get transcript data for specific date

## Query Analysis

### Query 1: Get Transcript Dates (Line 13)
```javascript
const result = await req.pool.query(`
  SELECT 
    DATE(t.created_at) as date,
    COUNT(*) as turn_count
  FROM meetings.turns t
  JOIN meetings.meetings m ON t.meeting_id = m.id
  WHERE m.client_id = $1
  GROUP BY DATE(t.created_at)
  ORDER BY date DESC
  LIMIT 30
`, [client_id]);
```
**Context**: GET /api/transcripts/dates endpoint  
**Purpose**: List available dates with conversation turn counts  
**Parameters**: `client_id` (from session)  
**Returns**: Last 30 dates with turn counts for client

### Query 2: Get Date Transcript (Line 48)
```javascript
const result = await req.pool.query(`
  SELECT 
    t.id,
    t.prompt,
    t.response,
    t.created_at,
    t.meeting_id,
    m.name as meeting_name
  FROM meetings.turns t
  JOIN meetings.meetings m ON t.meeting_id = m.id
  WHERE m.client_id = $1 
    AND DATE(t.created_at) = $2
  ORDER BY t.created_at ASC
`, [client_id, date]);
```
**Context**: GET /api/transcripts/date/:date endpoint  
**Purpose**: Get all turns for a specific date  
**Parameters**: `client_id`, `date` (YYYY-MM-DD format)  
**Returns**: Chronological turns for the date

## Proposed DatabaseAgent Methods

```javascript
// Transcript browsing operations
async getTranscriptDates(clientId, limit = 30)
async getTranscriptsByDate(clientId, date)
```

## Domain Classification
- **Primary**: Transcript Browsing
- **Secondary**: Turn History
- **Pattern**: Date-based aggregation and filtering

## Notes
- Client-scoped access control on all operations
- Date validation with regex pattern
- JSON parsing of response field on client side
- Proper JOIN between turns and meetings