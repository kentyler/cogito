# server/routes/meetings-crud.js - Query Catalog

## File Summary
- **Purpose**: CRUD operations for meetings (list, delete)
- **Query Count**: 8 queries
- **Main Operations**: List meetings with stats, Delete meeting with cascading

## Query Analysis

### Query 1: List Meetings (Line 43)
```javascript
const result = await req.db.query(query, [clientId]);
```
**Context**: GET /meetings endpoint  
**Purpose**: List all meetings for a client with detailed stats  
**Parameters**: `clientId` (from session)  
**Returns**: Meeting list with turn counts, participant counts, etc.  
**Large Query**: Yes - complex JOIN with aggregations (~25 lines)

### Query 2: Transaction Begin (Line 60)
```javascript
await client.query('BEGIN');
```
**Context**: DELETE /meetings/:meetingId endpoint  
**Purpose**: Start transaction for cascading delete  
**Parameters**: None  
**Returns**: Transaction control

### Query 3: Get Meeting Turns for Deletion (Line 63)
```javascript
const turnsResult = await client.query(`
  SELECT id 
  FROM meetings.turns
  WHERE meeting_id = $1
`, [meetingId]);
```
**Context**: DELETE /meetings/:meetingId endpoint  
**Purpose**: Get all turn IDs to delete before deleting meeting  
**Parameters**: `meetingId`  
**Returns**: Array of turn IDs

### Query 4: Delete Turns (Line 76)
```javascript
await client.query(`DELETE FROM meetings.turns WHERE id IN (${turnIdsList})`, turnIds);
```
**Context**: DELETE /meetings/:meetingId endpoint  
**Purpose**: Delete all turns associated with meeting  
**Parameters**: Dynamic list of turn IDs  
**Returns**: Delete confirmation

### Query 5: Delete Meeting (Line 81)
```javascript
const deleteMeetingResult = await client.query(`
  DELETE FROM meetings.meetings 
  WHERE id = $1
`, [meetingId]);
```
**Context**: DELETE /meetings/:meetingId endpoint  
**Purpose**: Delete the meeting record itself  
**Parameters**: `meetingId`  
**Returns**: Delete result with rowCount

### Query 6: Transaction Rollback (Line 87)
```javascript
await client.query('ROLLBACK');
```
**Context**: DELETE /meetings/:meetingId endpoint - error handling  
**Purpose**: Rollback transaction if meeting not found  
**Parameters**: None  
**Returns**: Transaction control

### Query 7: Transaction Commit (Line 91)
```javascript
await client.query('COMMIT');
```
**Context**: DELETE /meetings/:meetingId endpoint - success  
**Purpose**: Commit successful cascading delete  
**Parameters**: None  
**Returns**: Transaction control

### Query 8: Transaction Rollback (Line 103)
```javascript
await client.query('ROLLBACK');
```
**Context**: DELETE /meetings/:meetingId endpoint - error handling  
**Purpose**: Rollback transaction on any error  
**Parameters**: None  
**Returns**: Transaction control

## Proposed DatabaseAgent Methods

```javascript
// For the complex list query
async getMeetingsWithStats(clientId)

// For cascading delete operations  
async deleteMeetingWithTurns(meetingId)  // Handles transaction internally

// Generic transaction support
async transaction(callback)
```

## Domain Classification
- **Primary**: Meetings
- **Secondary**: Turns (for cascading delete)
- **Tertiary**: Transactions

## Notes
- Complex aggregation query for listing meetings
- Proper transaction handling for cascading deletes
- Clean separation between read and write operations