-- Migration: Unify meeting files structure
-- This migration consolidates the file relationship tables into a single unified structure
-- that can handle both old file_uploads and new context.files

BEGIN;

-- First, let's examine what data exists in the current meeting_files table
DO $$
DECLARE 
    file_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO file_count FROM meetings.meeting_files;
    RAISE NOTICE 'Found % existing meeting file relationships to migrate', file_count;
END $$;

-- Create a temporary backup of current meeting_files data
CREATE TEMP TABLE meeting_files_backup AS 
SELECT * FROM meetings.meeting_files;

-- Drop the existing meeting_files table
DROP TABLE meetings.meeting_files CASCADE;

-- Rename meeting_context_files to meeting_files
ALTER TABLE meetings.meeting_context_files RENAME TO meeting_files;

-- Rename the column to be more generic (can reference either file_uploads or context.files)
ALTER TABLE meetings.meeting_files RENAME COLUMN context_file_id TO file_id;

-- Add a file_source column to distinguish between different file sources
ALTER TABLE meetings.meeting_files 
ADD COLUMN file_source VARCHAR(20) DEFAULT 'context' CHECK (file_source IN ('file_uploads', 'context'));

-- Update the file_source for any existing records (they came from context files)
UPDATE meetings.meeting_files SET file_source = 'context';

-- Now migrate the backed up data from the old meeting_files structure
-- We need to migrate file_uploads to context.files first, then update references

-- For each file_upload referenced in the backup, create a corresponding context.files record
DO $$
DECLARE 
    backup_row RECORD;
    file_upload_row RECORD;
    new_context_file_id BIGINT;
BEGIN
    FOR backup_row IN SELECT DISTINCT file_upload_id FROM meeting_files_backup LOOP
        -- Get the file_upload data
        SELECT * INTO file_upload_row 
        FROM files.file_uploads 
        WHERE id = backup_row.file_upload_id;
        
        IF FOUND THEN
            -- Create corresponding context.files record
            INSERT INTO context.files (
                filename, 
                content_data, 
                content_type, 
                file_size, 
                source_type, 
                created_at, 
                metadata
            ) VALUES (
                file_upload_row.filename,
                file_upload_row.file_content,
                file_upload_row.content_type,
                file_upload_row.file_size,
                'upload',  -- Mark as uploaded file
                file_upload_row.created_at,
                COALESCE(file_upload_row.metadata, '{}'::jsonb)
            ) RETURNING id INTO new_context_file_id;
            
            -- Insert all meeting relationships for this file
            INSERT INTO meetings.meeting_files (
                meeting_id,
                file_id,
                file_source,
                relationship_type,
                created_at,
                created_by_user_id
            )
            SELECT 
                mfb.meeting_id,
                new_context_file_id,
                'context',  -- Now all files are in context schema
                'migrated_upload',
                mfb.created_at,
                mfb.created_by_user_id
            FROM meeting_files_backup mfb 
            WHERE mfb.file_upload_id = backup_row.file_upload_id;
            
            RAISE NOTICE 'Migrated file_upload % to context.files % with % meeting relationships', 
                file_upload_row.id, new_context_file_id, 
                (SELECT COUNT(*) FROM meeting_files_backup WHERE file_upload_id = backup_row.file_upload_id);
        END IF;
    END LOOP;
END $$;

-- Update indexes to match the renamed table and column
DROP INDEX IF EXISTS idx_meeting_context_files_meeting_id;
DROP INDEX IF EXISTS idx_meeting_context_files_context_file_id;
DROP INDEX IF EXISTS idx_meeting_context_files_created_at;

CREATE INDEX idx_meeting_files_meeting_id ON meetings.meeting_files(meeting_id);
CREATE INDEX idx_meeting_files_file_id ON meetings.meeting_files(file_id);
CREATE INDEX idx_meeting_files_created_at ON meetings.meeting_files(created_at DESC);
CREATE INDEX idx_meeting_files_file_source ON meetings.meeting_files(file_source);

-- Verify the migration worked
DO $$
DECLARE 
    migrated_count INTEGER;
    original_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM meeting_files_backup;
    SELECT COUNT(*) INTO migrated_count FROM meetings.meeting_files;
    
    RAISE NOTICE 'Migration verification: % original relationships, % migrated relationships', 
        original_count, migrated_count;
        
    IF migrated_count != original_count THEN
        RAISE WARNING 'Migration count mismatch! Expected %, got %', original_count, migrated_count;
    ELSE
        RAISE NOTICE '✅ Migration completed successfully - all relationships preserved';
    END IF;
END $$;

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
    'Schema Migration: Unify meeting files structure',
    'Migration tracking record for consolidating meeting file relationships into unified structure',
    'system',
    NOW(),
    NOW(),
    '{"migration": "012_unify_meeting_files", "action": "consolidate_meeting_file_relationships"}'::jsonb
);

COMMIT;

-- Final verification queries
SELECT 
    file_source,
    COUNT(*) as count,
    COUNT(DISTINCT meeting_id) as unique_meetings,
    COUNT(DISTINCT file_id) as unique_files
FROM meetings.meeting_files 
GROUP BY file_source;

SELECT 'Context files created from file_uploads migration:' as description, COUNT(*) as count
FROM context.files 
WHERE source_type = 'upload';