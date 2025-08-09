# lib/speaker-profile-agent/profile-storage.js - Query Catalog

## File Summary
- **Purpose**: Store speaker profiles as pseudo-files linked to meetings
- **Query Count**: 3 queries
- **Main Operations**: Link profile to meeting, check existing profiles, retrieve profiles

## Query Analysis

### Query 1: Link Profile to Meeting (Line 32)
```javascript
await this.databaseAgent.query(
  `INSERT INTO meeting_files (id, file_upload_id, created_by_user_id) 
   VALUES ($1, $2, $3)`,
  [meetingId, fileUpload.id, user.user_id]
);
```
**Context**: `storeProfileAsFile` method  
**Purpose**: Link generated profile file to meeting  
**Parameters**: `meetingId`, `fileUpload.id`, `user.user_id`  
**Returns**: Insert confirmation

### Query 2: Check Profile Exists (Line 55)
```javascript
const query = `
  SELECT 1 FROM meeting_files mf
  JOIN client_mgmt.file_uploads fu ON mf.file_upload_id = fu.id
  WHERE mf.id = $1 
    AND fu.filename LIKE $2
    AND fu.created_by_user_id = $3
  LIMIT 1
`;
```
**Context**: `profileExistsForMeeting` method  
**Purpose**: Check if speaker profile already exists for user in meeting  
**Parameters**: `meetingId`, `filename pattern`, `userId`  
**Returns**: Existence check (row count)

### Query 3: Get Profile for Meeting (Line 80)
```javascript
const query = `
  SELECT fu.* FROM meeting_files mf
  JOIN client_mgmt.file_uploads fu ON mf.file_upload_id = fu.id
  WHERE mf.id = $1 
    AND fu.filename LIKE $2
    AND fu.created_by_user_id = $3
  ORDER BY fu.created_at DESC
  LIMIT 1
`;
```
**Context**: `getProfileForMeeting` method  
**Purpose**: Retrieve existing speaker profile file for user in meeting  
**Parameters**: `meetingId`, `filename pattern`, `userId`  
**Returns**: Complete file upload record or null

## Proposed DatabaseAgent Methods

```javascript
// Speaker profile operations
async linkProfileToMeeting(meetingId, fileUploadId, userId)
async checkProfileExistsInMeeting(userId, meetingId)
async getProfileFromMeeting(userId, meetingId)
```

## Domain Classification
- **Primary**: Speaker Profile Management
- **Secondary**: File-Meeting Association
- **Pattern**: Profile-as-file storage with meeting linkage

## Notes
- Uses legacy `meeting_files` table with `file_upload_id` (vs newer `context.files`)
- Uses `client_mgmt.file_uploads` table for file metadata
- Filename pattern: `speaker-profile-{userId}.md`
- Integrates with `fileUploadService` for file creation
- Prevents duplicate profiles per user per meeting
- Stores profiles as searchable markdown files in meeting context