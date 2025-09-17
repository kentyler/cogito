-- Migration: Migrate existing turns.content_embedding to turn_embeddings table
-- This populates the new turn_embeddings table with data from existing turns

BEGIN;

-- Step 1: Insert existing turn embeddings into turn_embeddings table
-- Only insert turns that have content_embedding (not NULL)
INSERT INTO meetings.turn_embeddings (
  turn_id,
  content_text,
  embedding_vector,
  chunk_index,
  chunk_size,
  metadata,
  created_at,
  updated_at
)
SELECT 
  t.id as turn_id,
  t.content as content_text,              -- Use the turn's full content
  t.content_embedding as embedding_vector,
  0 as chunk_index,                       -- 0 indicates whole content (not chunked)
  LENGTH(t.content) as chunk_size,
  jsonb_build_object(
    'source', 'migrated_from_turns',
    'original_source_type', t.source_type,
    'migration_timestamp', NOW()
  ) as metadata,
  t.created_at,
  NOW() as updated_at
FROM meetings.turns t
WHERE t.content_embedding IS NOT NULL
  AND t.content IS NOT NULL
  AND LENGTH(TRIM(t.content)) > 0;

-- Log the migration results
DO $$
DECLARE
  migrated_count INTEGER;
  total_turns INTEGER;
  turns_with_embeddings INTEGER;
BEGIN
  -- Count what we migrated
  SELECT COUNT(*) INTO migrated_count 
  FROM meetings.turn_embeddings 
  WHERE metadata->>'source' = 'migrated_from_turns';
  
  -- Count total turns
  SELECT COUNT(*) INTO total_turns 
  FROM meetings.turns;
  
  -- Count turns that had embeddings
  SELECT COUNT(*) INTO turns_with_embeddings 
  FROM meetings.turns 
  WHERE content_embedding IS NOT NULL;
  
  -- Log results
  RAISE NOTICE 'Migration Results:';
  RAISE NOTICE '- Total turns: %', total_turns;
  RAISE NOTICE '- Turns with embeddings: %', turns_with_embeddings;
  RAISE NOTICE '- Successfully migrated: %', migrated_count;
  
  IF migrated_count != turns_with_embeddings THEN
    RAISE WARNING 'Mismatch: Expected to migrate % turns but migrated %', turns_with_embeddings, migrated_count;
  END IF;
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
    'Data Migration: Migrate turns.content_embedding to turn_embeddings',
    'Populated turn_embeddings table with existing turn embedding data',
    'system',
    NOW(),
    NOW(),
    '{"migration": "migrate_existing_turn_embeddings", "step": "2_migrate_turn_embeddings"}'::jsonb
);

COMMIT;

-- Verification queries
SELECT 
  'turns_with_content_embedding' as source,
  COUNT(*) as count
FROM meetings.turns 
WHERE content_embedding IS NOT NULL

UNION ALL

SELECT 
  'migrated_turn_embeddings' as source,
  COUNT(*) as count
FROM meetings.turn_embeddings
WHERE metadata->>'source' = 'migrated_from_turns'

ORDER BY source;