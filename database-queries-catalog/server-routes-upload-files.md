# server/routes/upload-files.js - Query Catalog

## File Summary
- **Purpose**: File upload and management operations
- **Query Count**: 9 queries
- **Main Operations**: List files, get file details, delete files with chunks

## Query Analysis

### Query 1: List User Files (Line 40)
```javascript
const result = await req.pool.query(`
  SELECT f.*, COUNT(c.id) as chunk_count
  FROM context.files f 
  LEFT JOIN context.chunks c ON f.id = c.file_id
  WHERE f.user_id = $1
  GROUP BY f.id
  ORDER BY f.created_at DESC
`, [userId]);
```
**Context**: GET /api/upload-files endpoint  
**Purpose**: List all files for a user with chunk counts  
**Parameters**: `userId` (from session)  
**Returns**: Files with chunk statistics

### Query 2: Get File Details (Line 80)
```javascript
const fileResult = await req.pool.query(`
  SELECT * FROM context.files WHERE id = $1 AND user_id = $2
`, [fileId, userId]);
```
**Context**: GET /api/upload-files/:id endpoint  
**Purpose**: Get specific file details with user verification  
**Parameters**: `fileId`, `userId`  
**Returns**: File record or null

### Query 3: Get File Chunks (Line 95)
```javascript
const chunksResult = await req.pool.query(`
  SELECT content_text, metadata, chunk_index
  FROM context.chunks 
  WHERE file_id = $1
  ORDER BY chunk_index
`, [fileId]);
```
**Context**: GET /api/upload-files/:id endpoint  
**Purpose**: Get all chunks for a file in order  
**Parameters**: `fileId`  
**Returns**: Ordered array of file chunks

### Query 4: Delete Transaction Begin (Line 128)
```javascript
await client.query('BEGIN');
```
**Context**: DELETE /api/upload-files/:id endpoint  
**Purpose**: Start transaction for cascading delete  
**Parameters**: None  
**Returns**: Transaction control

### Query 5: Delete File Chunks (Line 131)
```javascript
await client.query('DELETE FROM context.chunks WHERE file_id = $1', [id]);
```
**Context**: DELETE /api/upload-files/:id endpoint  
**Purpose**: Delete all chunks before deleting file  
**Parameters**: `fileId`  
**Returns**: Delete confirmation

### Query 6: Delete File Record (Line 134)
```javascript
const result = await client.query(`
  DELETE FROM context.files 
  WHERE id = $1 AND user_id = $2
  RETURNING filename
`, [id, userId]);
```
**Context**: DELETE /api/upload-files/:id endpoint  
**Purpose**: Delete file record with user verification  
**Parameters**: `fileId`, `userId`  
**Returns**: Deleted filename for confirmation

### Query 7: Transaction Rollback - Not Found (Line 143)
```javascript
await client.query('ROLLBACK');
```
**Context**: DELETE endpoint - file not found  
**Purpose**: Rollback if file doesn't exist or wrong user  
**Parameters**: None  
**Returns**: Transaction control

### Query 8: Transaction Commit (Line 147)
```javascript
await client.query('COMMIT');
```
**Context**: DELETE endpoint - success  
**Purpose**: Commit successful file deletion  
**Parameters**: None  
**Returns**: Transaction control

### Query 9: Transaction Rollback - Error (Line 151)
```javascript
await client.query('ROLLBACK');
```
**Context**: DELETE endpoint - error handling  
**Purpose**: Rollback transaction on any error  
**Parameters**: None  
**Returns**: Transaction control

## Proposed DatabaseAgent Methods

```javascript
// File operations
async getUserFiles(userId)
async getFileDetails(fileId, userId)  
async getFileChunks(fileId)
async deleteFileWithChunks(fileId, userId)  // Handles transaction internally

// Generic methods used here
async transaction(callback)
```

## Domain Classification
- **Primary**: File Management (context.files)
- **Secondary**: File Chunks (context.chunks)
- **Tertiary**: Transactions

## Notes
- Proper user-scoped access control on all operations
- Cascading delete with transaction safety
- File-chunk relationship properly maintained
- Clean separation between metadata and content