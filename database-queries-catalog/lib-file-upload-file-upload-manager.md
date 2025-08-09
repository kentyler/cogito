# lib/file-upload/file-upload-manager.js - Query Catalog

## File Summary
- **Purpose**: File upload record management with vector storage integration
- **Query Count**: 4 queries (with table inconsistencies)
- **Main Operations**: Create, retrieve, list, delete file upload records

## Query Analysis

### Query 1: Create File Upload (Line 39)
```javascript
const result = await this.pool.query(`
  INSERT INTO context.files 
  (filename, content_type, content_data, file_size, source_type, metadata) 
  VALUES ($1, $2, $3, $4, $5, $6) 
  RETURNING *
`, [
  filename,
  mimeType,
  fileContent, // This should be the actual file content as bytea
  fileSize || 0,
  'upload',
  JSON.stringify({
    description: description || null,
    tags: tags || null,
    client_id: clientId,
    original_path: filePath,
    public_url: publicUrl,
    bucket_name: bucketName
  })
]);
```
**Context**: `createFileUpload` method  
**Purpose**: Create new file upload record with metadata  
**Parameters**: `filename`, `mimeType`, `fileContent`, `fileSize`, metadata  
**Returns**: Complete file record

### Query 2: Get File by ID (Line 75)
```javascript
const result = await this.pool.query(
  'SELECT * FROM context.files WHERE id = $1 AND metadata->>\'client_id\' = $2',
  [fileId, clientId.toString()]
);
```
**Context**: `getFileUploadById` method  
**Purpose**: Retrieve specific file with client scope  
**Parameters**: `fileId`, `clientId`  
**Returns**: File record or null

### Query 3: List Files (Line 97)
```javascript
let query = 'SELECT * FROM file_uploads WHERE client_id = $1';
// Additional tag filtering and pagination logic
```
**Context**: `listFileUploads` method  
**Purpose**: List files for client with tag filtering  
**Parameters**: `clientId`, optional `tags`, `limit`, `offset`  
**Returns**: Array of file records  
**Note**: **BUG IDENTIFIED** - Uses `file_uploads` table instead of `context.files`

### Query 4: Delete File (Line 124)
```javascript
const result = await this.pool.query(
  'DELETE FROM file_uploads WHERE id = $1 AND client_id = $2 RETURNING *',
  [fileId, clientId]
);
```
**Context**: `deleteFileUpload` method  
**Purpose**: Delete file upload record  
**Parameters**: `fileId`, `clientId`  
**Returns**: Deleted file record  
**Note**: **BUG IDENTIFIED** - Uses `file_uploads` table instead of `context.files`

## Proposed DatabaseAgent Methods

```javascript
// File upload operations
async createFileWithContent(fileData)
async getFileById(fileId, clientId)
async listUserFiles(clientId, options = {})
async deleteFileUpload(fileId, clientId)
```

## Domain Classification
- **Primary**: File Management
- **Secondary**: Content Storage
- **Pattern**: CRUD operations with client scoping

## Notes
- **CRITICAL BUGS**: Queries 3 & 4 use `file_uploads` table, but queries 1 & 2 use `context.files`
- **TABLE INCONSISTENCY**: Mixed usage between legacy `file_uploads` and new `context.files` schema
- Stores client_id in metadata JSON field vs dedicated column
- Uses hardcoded connection string (should use environment variable)
- Supports tag-based filtering with PostgreSQL array operations
- Direct pool management instead of using shared database service