# lib/database-agent/search-analyzer.js - Query Catalog

## File Summary
- **Purpose**: Search operations and user analytics for transcript data
- **Query Count**: 4 queries
- **Main Operations**: Full-text search, user statistics, activity analysis

## Query Analysis

### Query 1: Search Transcripts (Line 53)
```javascript
const query = `
  SELECT 
    m.id,
    m.name as meeting_name,
    m.meeting_type,
    t.id,
    t.content,
    t.source_type,
    t.timestamp,
    t.metadata->>'speaker' as speaker,
    ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', $1)) as relevance_score
  FROM meetings m
  JOIN meetings.turns t ON m.id = t.id
  WHERE ${whereConditions.join(' AND ')}
  ORDER BY relevance_score DESC, t.timestamp DESC
  LIMIT $${paramIndex++} OFFSET $${paramIndex++}
`;
```
**Context**: `searchTranscripts` method  
**Purpose**: Full-text search across transcript content with ranking  
**Parameters**: `searchTerm`, optional `clientId`, `meetingId`, `sourceType`, `limit`, `offset`  
**Returns**: Ranked search results with relevance scores  
**Note**: **BUG IDENTIFIED** - JOIN uses `m.id = t.id` instead of `m.id = t.meeting_id`

### Query 2: User Basic Statistics (Line 103)
```javascript
this.connector.query(`
  SELECT 
    COUNT(DISTINCT m.id) as meetings_participated,
    COUNT(t.id) as total_turns,
    SUM(LENGTH(t.content)) as total_characters,
    MIN(t.timestamp) as first_activity,
    MAX(t.timestamp) as last_activity
  FROM meetings.turns t
  JOIN meetings m ON t.id = m.id
  WHERE t.metadata->>'user_id' = $1
`, [userId.toString()])
```
**Context**: `getUserStats` method  
**Purpose**: Get basic participation statistics for user  
**Parameters**: `userId` (as string)  
**Returns**: Meeting counts, turn counts, activity timespan  
**Note**: **BUG IDENTIFIED** - JOIN uses `t.id = m.id` instead of `t.meeting_id = m.id`

### Query 3: Meeting Types Breakdown (Line 116)
```javascript
this.connector.query(`
  SELECT 
    m.meeting_type,
    COUNT(DISTINCT m.id) as meeting_count,
    COUNT(t.id) as turn_count
  FROM meetings.turns t
  JOIN meetings m ON t.id = m.id
  WHERE t.metadata->>'user_id' = $1
  GROUP BY m.meeting_type
  ORDER BY meeting_count DESC
`, [userId.toString()])
```
**Context**: `getUserStats` method  
**Purpose**: Breakdown of user activity by meeting type  
**Parameters**: `userId` (as string)  
**Returns**: Meeting and turn counts grouped by meeting type  
**Note**: **BUG IDENTIFIED** - JOIN uses `t.id = m.id` instead of `t.meeting_id = m.id`

### Query 4: Daily Activity (Line 129)
```javascript
this.connector.query(`
  SELECT 
    DATE(t.timestamp) as activity_date,
    COUNT(t.id) as turns_count
  FROM meetings.turns t
  WHERE t.metadata->>'user_id' = $1
    AND t.timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(t.timestamp)
  ORDER BY activity_date DESC
`, [userId.toString()])
```
**Context**: `getUserStats` method  
**Purpose**: Daily activity breakdown for last 30 days  
**Parameters**: `userId` (as string)  
**Returns**: Daily turn counts for activity analysis

## Proposed DatabaseAgent Methods

```javascript
// Search operations
async searchTranscripts(searchTerm, options = {})
async getUserActivityStats(userId)
async getUserMeetingTypeBreakdown(userId)
async getUserDailyActivity(userId, days = 30)
```

## Domain Classification
- **Primary**: Full-text Search
- **Secondary**: User Analytics
- **Pattern**: Complex queries with aggregations and ranking

## Notes
- **CRITICAL BUGS**: Multiple JOIN conditions use `t.id = m.id` instead of `t.meeting_id = m.id`
- Uses PostgreSQL full-text search with ranking (`ts_rank`, `to_tsvector`, `plainto_tsquery`)
- Supports both exact match (ILIKE) and semantic search modes
- Stores user_id in metadata->>'user_id' as string
- Comprehensive user analytics with temporal analysis
- Search term highlighting with regex escaping
- Pagination support with LIMIT/OFFSET