-- Migration: Remove block meeting and attendee tables
-- These tables are part of the old "blocks" concept that has been migrated to "meetings".
-- The system now uses conversation.meetings directly without intermediate block relationships.
-- Tables being removed:
-- - block_meeting_files: Links files to block meetings (0 rows)
-- - block_attendees: Tracks meeting attendees via blocks (27 rows)  
-- - block_meetings: Links blocks to meetings with metadata (6 rows)

BEGIN;

-- Drop tables in dependency order to avoid foreign key issues
DROP TABLE IF EXISTS conversation.block_meeting_files CASCADE;
DROP TABLE IF EXISTS conversation.block_attendees CASCADE;
DROP TABLE IF EXISTS conversation.block_meetings CASCADE;

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Block meeting tables removal complete. System now uses direct meetings table.';
    RAISE NOTICE 'Removed: block_meeting_files, block_attendees, block_meetings';
END $$;

COMMIT;