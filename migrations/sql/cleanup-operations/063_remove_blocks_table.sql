-- Migration: Remove blocks table
-- The blocks concept has been fully migrated to meetings. All functionality that
-- previously used blocks (including turns, file associations, etc.) now works
-- directly with the meetings table. The blocks table is no longer needed.
-- 
-- Current state: 39 blocks exist but are not referenced by any other tables.
-- The turns table now uses meeting_id directly instead of block_id.

BEGIN;

-- Drop the blocks table - no foreign key constraints reference it
DROP TABLE IF EXISTS conversation.blocks CASCADE;

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Blocks table removal complete. System now uses meetings architecture exclusively.';
    RAISE NOTICE 'All transcript imports, file associations, and conversations now work through meetings table.';
END $$;

COMMIT;