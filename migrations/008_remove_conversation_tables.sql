-- Migration 008: Remove Conversation Tables
-- Date: 2025-06-29
-- Purpose: Complete removal of old conversation tables after migration to blocks/turns

BEGIN;

-- =====================================================================
-- PART 1: SAFETY CHECKS
-- =====================================================================

-- Check if there are any conversation tables with important data
DO $$
DECLARE
  conv_count INTEGER;
  interactions_count INTEGER;
  participants_count INTEGER;
BEGIN
  -- Check conversations
  SELECT COUNT(*) INTO conv_count FROM conversations;
  RAISE NOTICE 'Found % conversations to remove', conv_count;
  
  -- Check conversation_interactions
  SELECT COUNT(*) INTO interactions_count FROM conversation_interactions;
  RAISE NOTICE 'Found % conversation interactions to remove', interactions_count;
  
  -- Check conversation_participants  
  SELECT COUNT(*) INTO participants_count FROM conversation_participants;
  RAISE NOTICE 'Found % conversation participant records to remove', participants_count;
  
  IF conv_count > 100 OR interactions_count > 1000 OR participants_count > 100 THEN
    RAISE WARNING 'Large amount of data found. Consider migrating important data first.';
  END IF;
END $$;

-- =====================================================================
-- PART 2: CREATE FINAL BACKUP
-- =====================================================================

-- Create comprehensive backup of all conversation data
CREATE TABLE conversation_tables_final_backup AS
SELECT 
  'conversations' as table_name,
  id as record_id,
  row_to_json(c.*) as data,
  NOW() as backup_timestamp
FROM conversations c
UNION ALL
SELECT 
  'conversation_participants',
  id,
  row_to_json(cp.*),
  NOW()
FROM conversation_participants cp
UNION ALL
SELECT 
  'conversation_interactions', 
  id,
  row_to_json(ci.*),
  NOW()
FROM conversation_interactions ci;

-- Add comment to backup table
COMMENT ON TABLE conversation_tables_final_backup IS 'Final backup of conversation tables before removal - Migration 008';

-- =====================================================================
-- PART 3: DROP CONVERSATION TABLES
-- =====================================================================

-- Drop tables in dependency order (child tables first)
DROP TABLE IF EXISTS conversation_interactions CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop backup schema tables too
DROP TABLE IF EXISTS conversation_interactions_backup_schema CASCADE;
DROP TABLE IF EXISTS conversation_participants_backup_schema CASCADE;
DROP TABLE IF EXISTS conversation_turns_backup_schema CASCADE;
DROP TABLE IF EXISTS conversations_backup_schema CASCADE;

-- Drop any remaining views that reference conversation tables
DROP VIEW IF EXISTS conversation_participants_backup CASCADE;

-- =====================================================================
-- PART 4: CLEAN UP FUNCTIONS
-- =====================================================================

-- Remove functions that were specific to the old structure
DROP FUNCTION IF EXISTS get_conversation_participant_patterns(BIGINT, BIGINT);

-- =====================================================================
-- PART 5: UPDATE COMMENTS AND DOCUMENTATION
-- =====================================================================

-- Add comments to blocks/turns tables to document migration
COMMENT ON TABLE blocks IS 'Flexible content grouping - replaces conversations table (migrated 2025-06-29)';
COMMENT ON TABLE turns IS 'Individual content units - replaces conversation_interactions (migrated 2025-06-29)';
COMMENT ON TABLE block_turns IS 'Links turns to blocks with ordering - new architecture (created 2025-06-29)';

-- Add comment about pattern storage
COMMENT ON COLUMN participants.metadata IS 'Includes patterns (migrated from conversation_participants.participant_patterns)';

-- =====================================================================
-- PART 6: VERIFICATION
-- =====================================================================

-- Verify tables are gone
DO $$
DECLARE
  remaining_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name) INTO remaining_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'conversation%'
    AND table_name != 'conversation_tables_final_backup';
  
  IF remaining_tables IS NOT NULL THEN
    RAISE WARNING 'Remaining conversation tables: %', remaining_tables;
  ELSE
    RAISE NOTICE 'All conversation tables successfully removed';
  END IF;
END $$;

-- Show final statistics
DO $$
DECLARE
  blocks_count INTEGER;
  turns_count INTEGER;
  participants_count INTEGER;
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO blocks_count FROM blocks;
  SELECT COUNT(*) INTO turns_count FROM turns;
  SELECT COUNT(*) INTO participants_count FROM participants;
  SELECT COUNT(*) INTO backup_count FROM conversation_tables_final_backup;
  
  RAISE NOTICE 'Migration 008 Complete:';
  RAISE NOTICE '  Blocks: %', blocks_count;
  RAISE NOTICE '  Turns: %', turns_count;  
  RAISE NOTICE '  Participants: %', participants_count;
  RAISE NOTICE '  Backup records: %', backup_count;
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- After this migration:
-- 1. All conversation tables are removed
-- 2. Final backup is available in conversation_tables_final_backup
-- 3. Pattern storage is in participants.metadata->patterns
-- 4. Email analysis uses blocks/turns architecture
-- 5. Old analyzer code should be updated to use new structure

-- To restore from backup (if needed):
-- Use the data in conversation_tables_final_backup table
-- JSON can be expanded back to original table structure if necessary