# Conversation Tables Removal Plan

## Current Status

The migration 006 has been created but the old conversation tables are still being actively used by several parts of the codebase.

## Tables to Remove

1. `conversations`
2. `conversation_participants` 
3. `conversation_interactions`
4. `conversation_turns` (already migrated to `turns`)

## Code Still Using Old Tables

### Critical Dependencies

1. **`/lib/conversation-pattern-analyzer.js`** - Core library actively using all old tables:
   - Creates conversations in `conversations` table
   - Links participants via `conversation_participants`
   - Stores interactions in `conversation_interactions`

2. **Pattern Management Scripts** - Store patterns in `conversation_participants`:
   - `/insert-linden-final.js`
   - `/update-linden-patterns-simple.js`
   - `/run-linden-patterns.js`
   - `/check-patterns-schema.js`

3. **`/scripts/find-ian-participant.js`** - Queries `conversation_participants`

## Migration Strategy

### Phase 1: Update Pattern Storage (Priority: HIGH)
The participant patterns are currently stored in `conversation_participants.participant_patterns`. Need to:

1. Add `patterns` JSONB field to `participants` table if not exists
2. Migrate pattern data from `conversation_participants` to `participants`
3. Update all pattern scripts to use new location

### Phase 2: Update conversation-pattern-analyzer.js
This is the most complex change. Need to map:

1. `conversations` → `blocks` (with type='conversation' or 'email_thread')
2. `conversation_participants` → participant data stored in blocks or block metadata
3. `conversation_interactions` → `turns` linked to blocks via `block_turns`

### Phase 3: Create Migration Script
```sql
-- 007_remove_conversation_tables.sql
BEGIN;

-- First ensure all data is migrated
-- Check if any data exists that wasn't migrated
SELECT COUNT(*) as unmigrated_turns 
FROM conversation_turns ct
WHERE NOT EXISTS (
  SELECT 1 FROM turns t 
  WHERE t.source_turn_id = ct.id::text
);

-- Migrate participant patterns to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS patterns JSONB DEFAULT '{}';

UPDATE participants p
SET patterns = cp.participant_patterns
FROM conversation_participants cp
WHERE p.id = cp.participant_id
AND cp.participant_patterns IS NOT NULL
AND cp.participant_patterns != '{}';

-- Create backup before dropping
CREATE TABLE conversation_tables_backup AS 
SELECT 'conversations' as table_name, row_to_json(c.*) as data
FROM conversations c
UNION ALL
SELECT 'conversation_participants', row_to_json(cp.*)
FROM conversation_participants cp
UNION ALL
SELECT 'conversation_interactions', row_to_json(ci.*)
FROM conversation_interactions ci
UNION ALL
SELECT 'conversation_turns', row_to_json(ct.*)
FROM conversation_turns ct;

-- Drop the old tables
DROP TABLE IF EXISTS conversation_interactions CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversation_turns CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop backup schema tables too
DROP TABLE IF EXISTS conversation_interactions_backup_schema CASCADE;
DROP TABLE IF EXISTS conversation_participants_backup_schema CASCADE;
DROP TABLE IF EXISTS conversation_turns_backup_schema CASCADE;
DROP TABLE IF EXISTS conversations_backup_schema CASCADE;

COMMIT;
```

## Implementation Steps

1. **Add patterns field to participants table** (if not exists)
2. **Create updated conversation-pattern-analyzer.js** that uses blocks/turns
3. **Update all pattern management scripts** to use participants.patterns
4. **Test thoroughly** with sample data
5. **Run final migration** to remove old tables
6. **Keep backup** for rollback capability

## Risks & Mitigations

- **Risk**: Active code still using old tables
  - **Mitigation**: Update all code first, test thoroughly

- **Risk**: Pattern data loss
  - **Mitigation**: Migrate patterns to participants table, verify completeness

- **Risk**: Email analysis breaking
  - **Mitigation**: Carefully update conversation-pattern-analyzer.js with compatibility layer

## Recommendation

**DO NOT remove the conversation tables yet**. First:

1. Update all code to use the new blocks/turns architecture
2. Migrate pattern data to appropriate location
3. Test all functionality
4. Only then run the removal migration

The blocks/turns architecture is superior and should completely replace the conversation tables, but the migration needs to be completed first in the application code.