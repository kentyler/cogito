-- Migration: Replace files schema with context schema
-- This migration moves all data from files.file_uploads to context.files
-- and updates meeting_files to reference the new structure

BEGIN;

-- Step 1: Migrate all file_uploads metadata to context.files
-- Note: file_uploads stores files on disk (file_path), not in database
-- We'll create placeholder records and handle file content migration separately
DO $$
DECLARE 
    upload_row RECORD;
    upload_count INTEGER;
    placeholder_content BYTEA;
BEGIN
    SELECT COUNT(*) INTO upload_count FROM files.file_uploads;
    RAISE NOTICE 'Migrating % file uploads to context.files', upload_count;
    
    -- Create placeholder content for files we can't read from SQL
    placeholder_content := '[FILE CONTENT NEEDS MANUAL MIGRATION FROM DISK]'::bytea;
    
    FOR upload_row IN SELECT * FROM files.file_uploads ORDER BY id LOOP
        INSERT INTO context.files (
            filename,
            content_data,
            content_type, 
            file_size,
            source_type,
            created_at,
            metadata
        ) VALUES (
            upload_row.filename,
            placeholder_content,
            COALESCE(upload_row.mime_type, 'application/octet-stream'),
            COALESCE(upload_row.file_size, 0),
            'upload',
            upload_row.uploaded_at,
            jsonb_build_object(
                'original_file_path', upload_row.file_path,
                'public_url', upload_row.public_url,
                'bucket_name', upload_row.bucket_name,
                'description', upload_row.description,
                'tags', upload_row.tags,
                'client_id', upload_row.client_id,
                'needs_content_migration', true
            )
        );
        
        RAISE NOTICE 'Migrated file metadata: % (ID: %) - content needs manual migration from %', 
            upload_row.filename, upload_row.id, upload_row.file_path;
    END LOOP;
    
    RAISE WARNING 'File contents need to be migrated manually from disk paths stored in metadata';
END $$;

-- Step 2: Update meetings.meeting_files to reference context.files instead of file_uploads
-- Create a mapping between old file_upload_id and new context.files id
CREATE TEMP TABLE file_id_mapping AS
SELECT 
    fu.id as old_file_upload_id,
    cf.id as new_context_file_id
FROM files.file_uploads fu
JOIN context.files cf ON (
    fu.filename = cf.filename 
    AND fu.uploaded_at = cf.created_at
    AND cf.source_type = 'upload'
)
ORDER BY fu.id;

-- Verify the mapping is complete
DO $$
DECLARE 
    original_count INTEGER;
    mapped_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM files.file_uploads;
    SELECT COUNT(*) INTO mapped_count FROM file_id_mapping;
    
    IF original_count != mapped_count THEN
        RAISE EXCEPTION 'File mapping incomplete: % original files, % mapped files', 
            original_count, mapped_count;
    END IF;
    
    RAISE NOTICE 'File mapping complete: % files mapped', mapped_count;
END $$;

-- Step 3: Create new meeting_files table structure referencing context.files
CREATE TABLE meetings.meeting_files_new (
    meeting_id UUID NOT NULL,
    file_id BIGINT NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'context',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id BIGINT,
    
    FOREIGN KEY (meeting_id) REFERENCES meetings.meetings(meeting_id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES context.files(id) ON DELETE CASCADE,
    
    PRIMARY KEY (meeting_id, file_id)
);

-- Step 4: Migrate meeting_files data using the mapping
INSERT INTO meetings.meeting_files_new (
    meeting_id,
    file_id, 
    relationship_type,
    created_at,
    created_by_user_id
)
SELECT 
    mf.meeting_id,
    fim.new_context_file_id,
    'migrated_upload',
    mf.created_at,
    mf.created_by_user_id
FROM meetings.meeting_files mf
JOIN file_id_mapping fim ON mf.file_upload_id = fim.old_file_upload_id;

-- Step 5: Verify migration
DO $$
DECLARE 
    original_count INTEGER;
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM meetings.meeting_files;
    SELECT COUNT(*) INTO migrated_count FROM meetings.meeting_files_new;
    
    IF original_count != migrated_count THEN
        RAISE EXCEPTION 'Meeting files migration incomplete: % original, % migrated', 
            original_count, migrated_count;
    END IF;
    
    RAISE NOTICE 'Meeting files migration complete: % relationships migrated', migrated_count;
END $$;

-- Step 6: Replace old meeting_files with new structure
DROP TABLE meetings.meeting_files CASCADE;
DROP TABLE meetings.meeting_context_files CASCADE;  -- Remove the one created in previous migration
ALTER TABLE meetings.meeting_files_new RENAME TO meeting_files;

-- Step 7: Drop the entire files schema
DROP SCHEMA files CASCADE;

-- Step 8: Create indexes for the new meeting_files table
CREATE INDEX idx_meeting_files_meeting_id ON meetings.meeting_files(meeting_id);
CREATE INDEX idx_meeting_files_file_id ON meetings.meeting_files(file_id);
CREATE INDEX idx_meeting_files_created_at ON meetings.meeting_files(created_at DESC);
CREATE INDEX idx_meeting_files_relationship_type ON meetings.meeting_files(relationship_type);

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
    'Schema Migration: Replace files schema with context schema',
    'Migration tracking record for replacing files.file_uploads with context.files and updating all references',
    'system',
    NOW(),
    NOW(),
    '{"migration": "012_replace_files_with_context", "action": "replace_files_schema_with_context"}'::jsonb
);

COMMIT;

-- Final verification
SELECT 'Total context files:' as description, COUNT(*) as count FROM context.files;
SELECT 'Files from uploads:' as description, COUNT(*) as count FROM context.files WHERE source_type = 'upload';
SELECT 'Meeting file relationships:' as description, COUNT(*) as count FROM meetings.meeting_files;
SELECT 'Schemas remaining:' as description, string_agg(schema_name, ', ') as schemas 
FROM information_schema.schemata 
WHERE schema_name IN ('files', 'context');