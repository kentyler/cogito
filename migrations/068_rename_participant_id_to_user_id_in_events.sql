-- Migration: Rename participant_id to user_id in events.events table
-- This aligns the events table with the user-centric architecture

BEGIN;

-- Check if the column exists before attempting to rename
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'events' 
        AND table_name = 'events' 
        AND column_name = 'participant_id'
    ) THEN
        -- Rename participant_id to user_id
        ALTER TABLE events.events RENAME COLUMN participant_id TO user_id;
        
        -- Update any indexes that reference the old column name
        -- Note: PostgreSQL automatically updates simple indexes when columns are renamed
        
        RAISE NOTICE 'Successfully renamed participant_id to user_id in events.events table';
    ELSE
        RAISE NOTICE 'Column participant_id does not exist in events.events, no action needed';
    END IF;
END $$;

COMMIT;