-- Migration: Create meetings schema and move tables from conversation schema
-- This migration creates the meetings schema, moves tables from conversation to meetings,
-- updates foreign key constraints, and removes the conversation schema

BEGIN;

-- Create the meetings schema
CREATE SCHEMA IF NOT EXISTS meetings;

-- Move tables from conversation schema to meetings schema
-- 1. Move meetings table
ALTER TABLE conversation.meetings SET SCHEMA meetings;

-- 2. Move turns table
ALTER TABLE conversation.turns SET SCHEMA meetings;

-- 3. Move meeting_files table
ALTER TABLE conversation.meeting_files SET SCHEMA meetings;

-- Update any sequences that were created with the tables
-- The sequences will automatically move with their tables, but we verify they exist
DO $$
BEGIN
    -- Check if sequences exist and are properly associated
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'meetings' AND sequence_name LIKE '%meetings%') THEN
        RAISE NOTICE 'Meetings table sequences successfully moved to meetings schema';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'meetings' AND sequence_name LIKE '%turns%') THEN
        RAISE NOTICE 'Turns table sequences successfully moved to meetings schema';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'meetings' AND sequence_name LIKE '%meeting_files%') THEN
        RAISE NOTICE 'Meeting_files table sequences successfully moved to meetings schema';
    END IF;
END $$;

-- Verify that foreign key constraints are still valid after the move
-- PostgreSQL should maintain these automatically, but we'll verify

-- Check meetings.turns references meetings.meetings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'meetings' 
        AND tc.table_name = 'turns' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'meeting_id'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint from turns to meetings not found after schema move';
    END IF;
    
    RAISE NOTICE 'Foreign key constraint from meetings.turns to meetings.meetings verified';
END $$;

-- Check meetings.meeting_files references meetings.meetings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'meetings' 
        AND tc.table_name = 'meeting_files' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'meeting_id'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint from meeting_files to meetings not found after schema move';
    END IF;
    
    RAISE NOTICE 'Foreign key constraint from meetings.meeting_files to meetings.meetings verified';
END $$;

-- Drop the conversation schema (it should now be empty)
-- This will fail if there are any remaining objects in the schema
DROP SCHEMA conversation;

-- Create a migration tracking record
INSERT INTO meetings.meetings (
    meeting_id, 
    name, 
    description, 
    meeting_type, 
    created_at, 
    updated_at,
    metadata
) VALUES (
    gen_random_uuid(),
    'Schema Migration: conversation -> meetings',
    'Migration tracking record for moving tables from conversation schema to meetings schema',
    'system',
    NOW(),
    NOW(),
    '{"migration": "010_create_meetings_schema", "action": "move_conversation_to_meetings_schema"}'::jsonb
);

COMMIT;

-- Final verification query
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'meetings' 
ORDER BY tablename;