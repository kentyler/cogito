# Session Context - Database Query Cataloging Complete

## Date: 2025-08-09

## What We Accomplished Today
Successfully cataloged ALL database queries across the entire Cogito codebase:
- Created `database-queries-catalog/` directory with organized documentation
- Cataloged 33 files containing 90+ database queries
- Each catalog file documents queries, parameters, returns, and proposed DatabaseAgent methods
- Identified 15+ critical bugs that need fixing

## Critical Bugs Found (MUST FIX FIRST)
### Schema Reference Bugs (Wrong Table Names):
1. **server/routes/meetings-embeddings.js**: Line 24 - Uses `t.id = $1` instead of `t.meeting_id = $1`
2. **server/routes/meetings-additional.js**: Line 48 - Uses `meetings` instead of `meetings.meetings`
3. **server/routes/extension-api.js**: Line 66 - JOIN uses `m.meeting_id` instead of `m.id`
4. **server/services/meeting-cleanup-service.js**: Line 128 - Uses `meetings` instead of `meetings.meetings`
5. **server/services/email-service.js**: Line 114 - Uses `meetings` instead of `meetings.meetings`
6. **lib/turn-processor.js**: Lines 152, 173 - Uses `turns` instead of `meetings.turns`

### JOIN Condition Bugs (Wrong Column References):
7. **lib/database-agent/search-analyzer.js**: Lines 65, 111, 122 - JOIN uses `t.id = m.id` instead of `t.meeting_id = m.id`
8. **lib/database-agent/transcript-processor.js**: Line 80 - JOIN uses `m.id = t.id` instead of `m.id = t.meeting_id`

### Table Inconsistency:
9. **lib/file-upload/file-upload-manager.js**: Inconsistent - uses `context.files` for INSERT/SELECT but `file_uploads` for LIST/DELETE

## Next Steps (In Order)
1. **Fix all 15+ schema/table bugs** 
   - Create a single commit fixing all schema issues
   - Test each fix with the dev database
   - These bugs are causing queries to fail or return wrong data

2. **Design DatabaseAgent methods**
   - Review all catalog files in `database-queries-catalog/`
   - Create comprehensive method signatures covering all 90+ queries
   - Group methods by domain (meetings, turns, users, files, etc.)

3. **Implement centralized DatabaseAgent**
   - Replace scattered queries with centralized methods
   - Use the catalog as implementation guide
   - Maintain backward compatibility with existing code

4. **Create regression test suite**
   - Use dev database for testing
   - Cover all DatabaseAgent methods
   - Ensure bugs don't reoccur

## Key Insights from Cataloging
- Database queries are scattered across 33+ files
- Many queries have similar patterns that can be consolidated
- Schema migration from `meetings` to `meetings.meetings` was incomplete
- JOIN conditions have systematic errors (using wrong ID columns)
- Mix of legacy tables (`file_uploads`) and new schema (`context.files`)

## Development Database
- Created dev database copy on Render for safe testing
- Contains full production data snapshot
- Ready for testing bug fixes and new DatabaseAgent

## Important Context
- This is part of larger effort to centralize database operations
- User previously emphasized: "no shortcuts" - need comprehensive solution
- All queries must be migrated to DatabaseAgent, not just "core" ones
- Schema Change Protocol added to CLAUDE.md documenting this lesson

## Files to Reference Tomorrow
- `/database-queries-catalog/` - Complete query documentation
- `CLAUDE.md` - Schema Change Protocol section
- This file - Bug list and next steps

## Morning Priority
Start with fixing the 15+ schema/table bugs BEFORE any other work. These are breaking production queries.