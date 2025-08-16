# Database Queries Catalog

## Summary
- **Server queries**: 85
- **Lib queries**: 77  
- **Scripts queries**: ~30
- **Total estimated**: 200+ queries

## By Domain (Preliminary Analysis)

### Meetings Domain
- Create meetings
- Find meetings by ID, bot ID, client ID
- Update meeting status, transcript
- Delete meetings
- List meetings with filters

### Turns Domain  
- Create turns
- Find turns by meeting ID
- Store turn embeddings
- Search turns by content

### Users/Auth Domain
- User authentication
- Client management
- Session handling

### File Upload Domain
- Store file metadata
- File content search
- Vector embeddings

### Bot Management Domain
- Create/manage Recall.ai bots
- Bot status tracking
- Stuck meeting handling

## Files with Most Queries (Top 10)
1. lib/how-to-service.js: 12 queries  
2. lib/location-manager.js: 11 queries
3. server/routes/upload-files.js: 9 queries
4. server/routes/meetings-crud.js: 8 queries
5. Multiple files with 6+ queries each

## Next Steps
1. Extract actual SQL from each file
2. Categorize by operation type (SELECT/INSERT/UPDATE/DELETE)
3. Design DatabaseAgent methods
4. Create migration plan

*This is a living document - will be updated as we catalog each query*