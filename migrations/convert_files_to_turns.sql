-- Migration: Convert context.files records to turns
-- Each file becomes a turn with source_type='file_upload'

BEGIN;

-- Step 1: Convert context.files to turns
-- Need to figure out client_id for each file - let's check if files are linked to clients
DO $$
DECLARE
  file_rec RECORD;
  new_turn_id UUID;
  file_content_text TEXT;
BEGIN
  -- Loop through each file in context.files
  FOR file_rec IN 
    SELECT 
      f.id,
      f.filename,
      f.content_data,
      f.content_type,
      f.file_size,
      f.source_type,
      f.created_at,
      f.metadata
    FROM context.files f
    ORDER BY f.created_at
  LOOP
    -- Extract text content from file data
    -- For now, assume it's UTF-8 text (we'll handle PDF extraction separately)
    BEGIN
      file_content_text := convert_from(file_rec.content_data, 'UTF8');
    EXCEPTION 
      WHEN OTHERS THEN
        -- If conversion fails, store as base64 with note
        file_content_text := 'Binary file content (base64): ' || encode(file_rec.content_data, 'base64');
    END;
    
    -- Generate new UUID for the turn
    new_turn_id := gen_random_uuid();
    
    -- Insert as a turn
    -- NOTE: We need to determine client_id - for now using NULL, will need manual assignment
    INSERT INTO meetings.turns (
      id,
      meeting_id,        -- NULL for file uploads (like Talk tab)
      client_id,         -- TODO: Need to determine this per file
      user_id,           -- TODO: Extract from file metadata if available
      content,
      source_type,
      turn_index,
      metadata,
      timestamp,
      created_at
    ) VALUES (
      new_turn_id,
      NULL,              -- No meeting association
      NULL,              -- TODO: Determine client_id from file context
      NULL,              -- TODO: Extract user_id from metadata if available  
      file_content_text,
      'file_upload',
      EXTRACT(EPOCH FROM file_rec.created_at), -- Use file creation time as turn_index
      jsonb_build_object(
        'source', 'migrated_from_context_files',
        'original_file_id', file_rec.id,
        'filename', file_rec.filename,
        'content_type', file_rec.content_type,
        'file_size', file_rec.file_size,
        'original_source_type', file_rec.source_type,
        'migration_timestamp', NOW()
      ),
      file_rec.created_at, -- Use original file timestamp
      file_rec.created_at
    );
    
    -- Store the mapping for later use in chunk migration
    -- We'll use a temporary table to track file_id -> turn_id mapping
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'temp_file_turn_mapping') THEN
      CREATE TEMPORARY TABLE temp_file_turn_mapping (
        file_id BIGINT,
        turn_id UUID,
        filename VARCHAR(255)
      );
    END IF;
    
    INSERT INTO temp_file_turn_mapping (file_id, turn_id, filename)
    VALUES (file_rec.id, new_turn_id, file_rec.filename);
    
    -- Log progress every 10 files
    IF file_rec.id % 10 = 0 THEN
      RAISE NOTICE 'Converted file % to turn %: %', file_rec.id, new_turn_id, file_rec.filename;
    END IF;
    
  END LOOP;
  
  -- Report results
  DECLARE
    total_files INTEGER;
    converted_turns INTEGER;
  BEGIN
    SELECT COUNT(*) INTO total_files FROM context.files;
    SELECT COUNT(*) INTO converted_turns FROM meetings.turns WHERE metadata->>'source' = 'migrated_from_context_files';
    
    RAISE NOTICE 'File to Turn Conversion Results:';
    RAISE NOTICE '- Total files: %', total_files;
    RAISE NOTICE '- Converted to turns: %', converted_turns;
  END;
END $$;

-- Create migration tracking record
INSERT INTO meetings.meetings (
    id, 
    name, 
    description, 
    meeting_type, 
    created_at, 
    updated_at,
    metadata
) VALUES (
    gen_random_uuid(),
    'Data Migration: Convert context.files to turns',
    'Converted all files in context.files to turns with source_type=file_upload',
    'system',
    NOW(),
    NOW(),
    '{"migration": "convert_files_to_turns", "step": "3_convert_files"}'::jsonb
);

COMMIT;

-- Verification queries
SELECT 
  'original_files' as source,
  COUNT(*) as count
FROM context.files

UNION ALL

SELECT 
  'converted_file_turns' as source,
  COUNT(*) as count
FROM meetings.turns
WHERE metadata->>'source' = 'migrated_from_context_files'

ORDER BY source;