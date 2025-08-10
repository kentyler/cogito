-- Migration: Clean up old tables after consolidation
-- This migration removes the old blocks and block_meetings tables
-- ONLY RUN THIS AFTER VERIFYING THE CONSOLIDATION WAS SUCCESSFUL
-- AND ALL CODE HAS BEEN UPDATED TO USE THE MEETINGS TABLE

BEGIN;

-- Step 1: Verify the migration was successful
DO $$
DECLARE
    meetings_count INTEGER;
    blocks_count INTEGER;
    block_meetings_count INTEGER;
    turns_with_meeting_id INTEGER;
    turns_with_block_id INTEGER;
BEGIN
    -- Count records in each table
    SELECT COUNT(*) INTO meetings_count FROM conversation.meetings WHERE meeting_type != 'system';
    SELECT COUNT(*) INTO blocks_count FROM conversation.blocks;
    SELECT COUNT(*) INTO block_meetings_count FROM conversation.block_meetings;
    SELECT COUNT(*) INTO turns_with_meeting_id FROM conversation.turns WHERE meeting_id IS NOT NULL;
    SELECT COUNT(*) INTO turns_with_block_id FROM conversation.turns WHERE block_id IS NOT NULL;
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE '  Meetings: % records', meetings_count;
    RAISE NOTICE '  Blocks: % records', blocks_count;
    RAISE NOTICE '  Block_meetings: % records', block_meetings_count;
    RAISE NOTICE '  Turns with meeting_id: %', turns_with_meeting_id;
    RAISE NOTICE '  Turns with block_id: %', turns_with_block_id;
    
    -- Verify that turns have been properly migrated
    IF turns_with_meeting_id = 0 AND turns_with_block_id > 0 THEN
        RAISE EXCEPTION 'Turns have not been migrated to use meeting_id. Aborting cleanup.';
    END IF;
    
    -- Verify that we have roughly the expected number of meetings
    IF meetings_count < (blocks_count - 5) THEN -- Allow some variance
        RAISE EXCEPTION 'Meeting count (%) is significantly less than blocks count (%). Migration may have failed.', meetings_count, blocks_count;
    END IF;
END $$;

-- Step 2: Drop foreign key constraints that reference the old tables
-- Drop the block_id column from turns table
ALTER TABLE conversation.turns DROP COLUMN IF EXISTS block_id;

-- Step 3: Handle block_meeting_files table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'conversation' AND table_name = 'block_meeting_files') THEN
        -- Drop the old block_meeting_id column after ensuring meeting_id is populated
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'conversation' AND table_name = 'block_meeting_files' AND column_name = 'meeting_id') THEN
            -- Verify all records have meeting_id before dropping block_meeting_id
            DECLARE
                missing_meeting_id INTEGER;
            BEGIN
                SELECT COUNT(*) INTO missing_meeting_id 
                FROM conversation.block_meeting_files 
                WHERE meeting_id IS NULL;
                
                IF missing_meeting_id = 0 THEN
                    ALTER TABLE conversation.block_meeting_files DROP COLUMN IF EXISTS block_meeting_id;
                    RAISE NOTICE 'Removed block_meeting_id column from block_meeting_files';
                ELSE
                    RAISE EXCEPTION 'Cannot drop block_meeting_id: % records are missing meeting_id', missing_meeting_id;
                END IF;
            END;
        END IF;
    END IF;
END $$;

-- Step 4: Drop the old tables
-- Note: These drops will cascade to any remaining foreign key references

-- Drop block_meetings table first (it references blocks)
DROP TABLE IF EXISTS conversation.block_meetings CASCADE;
RAISE NOTICE 'Dropped conversation.block_meetings table';

-- Drop blocks table
DROP TABLE IF EXISTS conversation.blocks CASCADE;
RAISE NOTICE 'Dropped conversation.blocks table';

-- Step 5: Clean up any remaining indexes or constraints that might reference the old tables
-- (PostgreSQL should handle this automatically with CASCADE, but let's be thorough)

-- Step 6: Update the migration record
UPDATE conversation.meetings 
SET 
    description = description || ' - Old tables cleaned up on ' || NOW()::text,
    updated_at = NOW(),
    metadata = metadata || jsonb_build_object('cleanup_completed', NOW()::text)
WHERE name = 'Schema Migration Record' 
  AND meeting_type = 'system'
  AND metadata->>'migration_id' = '050';

-- Step 7: Verify cleanup was successful
DO $$
BEGIN
    -- Check that tables no longer exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'conversation' AND table_name = 'blocks') THEN
        RAISE EXCEPTION 'blocks table still exists after cleanup';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'conversation' AND table_name = 'block_meetings') THEN
        RAISE EXCEPTION 'block_meetings table still exists after cleanup';
    END IF;
    
    RAISE NOTICE 'Cleanup verification successful: old tables have been removed';
END $$;

COMMIT;

-- Final reminder for developers
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION 051 COMPLETED ===';
    RAISE NOTICE 'The blocks and block_meetings tables have been successfully removed.';
    RAISE NOTICE 'All code should now use the conversation.meetings table.';
    RAISE NOTICE 'Key changes for developers:';
    RAISE NOTICE '  - block_id columns are now meeting_id';
    RAISE NOTICE '  - conversation.blocks table is now conversation.meetings';
    RAISE NOTICE '  - conversation.block_meetings table has been merged into meetings';
    RAISE NOTICE '  - All foreign keys now reference meetings(meeting_id)';
    RAISE NOTICE '';
END $$;