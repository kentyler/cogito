-- Migration: Migrate context.chunks to turn_embeddings
-- This converts file chunks to turn_embeddings linked to the newly created file turns

BEGIN;

-- Step 1: Migrate context.chunks to turn_embeddings
-- We need to use the temp_file_turn_mapping created in the previous migration
-- to link chunks to their corresponding turns

DO $$
DECLARE
  chunk_rec RECORD;
  target_turn_id UUID;
  total_chunks INTEGER := 0;
  migrated_chunks INTEGER := 0;
  orphaned_chunks INTEGER := 0;
BEGIN
  -- First, recreate the mapping table if it doesn't exist
  -- (in case migrations are run separately)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'temp_file_turn_mapping') THEN
    CREATE TEMPORARY TABLE temp_file_turn_mapping AS
    SELECT 
      (t.metadata->>'original_file_id')::BIGINT as file_id,
      t.id as turn_id,
      t.metadata->>'filename' as filename
    FROM meetings.turns t
    WHERE t.metadata->>'source' = 'migrated_from_context_files'
      AND t.metadata->>'original_file_id' IS NOT NULL;
    
    RAISE NOTICE 'Recreated temp_file_turn_mapping with % entries', (SELECT COUNT(*) FROM temp_file_turn_mapping);
  END IF;
  
  -- Count total chunks to migrate
  SELECT COUNT(*) INTO total_chunks FROM context.chunks;
  RAISE NOTICE 'Starting migration of % chunks from context.chunks', total_chunks;
  
  -- Loop through each chunk
  FOR chunk_rec IN 
    SELECT 
      c.id,
      c.file_id,
      c.content,
      c.embedding_vector,
      c.chunk_index,
      c.metadata,
      c.created_at
    FROM context.chunks c
    ORDER BY c.file_id, c.chunk_index
  LOOP
    -- Find the corresponding turn_id for this file
    SELECT ftm.turn_id INTO target_turn_id
    FROM temp_file_turn_mapping ftm
    WHERE ftm.file_id = chunk_rec.file_id;
    
    IF target_turn_id IS NOT NULL THEN
      -- Insert the chunk as a turn_embedding
      INSERT INTO meetings.turn_embeddings (
        turn_id,
        content_text,
        embedding_vector,
        chunk_index,
        chunk_size,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        target_turn_id,
        chunk_rec.content,
        chunk_rec.embedding_vector,
        chunk_rec.chunk_index + 1, -- Add 1 since file chunks start at 0, but we reserve 0 for whole content
        LENGTH(chunk_rec.content),
        jsonb_build_object(
          'source', 'migrated_from_context_chunks',
          'original_chunk_id', chunk_rec.id,
          'original_file_id', chunk_rec.file_id,
          'migration_timestamp', NOW()
        ) || COALESCE(chunk_rec.metadata, '{}'::jsonb),
        chunk_rec.created_at,
        NOW()
      );
      
      migrated_chunks := migrated_chunks + 1;
      
      -- Log progress every 50 chunks
      IF migrated_chunks % 50 = 0 THEN
        RAISE NOTICE 'Migrated % chunks so far...', migrated_chunks;
      END IF;
      
    ELSE
      -- Orphaned chunk (file not found in turns)
      orphaned_chunks := orphaned_chunks + 1;
      RAISE WARNING 'Orphaned chunk found - no corresponding turn for file_id %', chunk_rec.file_id;
    END IF;
  END LOOP;
  
  -- Report results
  RAISE NOTICE 'Chunk Migration Results:';
  RAISE NOTICE '- Total chunks: %', total_chunks;
  RAISE NOTICE '- Successfully migrated: %', migrated_chunks;
  RAISE NOTICE '- Orphaned chunks: %', orphaned_chunks;
  
END $$;

-- Clean up temporary table
DROP TABLE IF EXISTS temp_file_turn_mapping;

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
    'Data Migration: Migrate context.chunks to turn_embeddings',
    'Migrated all context.chunks to turn_embeddings linked to file turns',
    'system',
    NOW(),
    NOW(),
    '{"migration": "migrate_context_chunks_to_turn_embeddings", "step": "4_migrate_chunks"}'::jsonb
);

COMMIT;

-- Verification queries
SELECT 
  'original_chunks' as source,
  COUNT(*) as count
FROM context.chunks

UNION ALL

SELECT 
  'migrated_chunk_embeddings' as source,
  COUNT(*) as count
FROM meetings.turn_embeddings
WHERE metadata->>'source' = 'migrated_from_context_chunks'

UNION ALL

SELECT 
  'total_turn_embeddings' as source,
  COUNT(*) as count
FROM meetings.turn_embeddings

ORDER BY source;