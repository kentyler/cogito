-- Migration 007: Migrate participant patterns from conversation_participants to participants.metadata
-- Date: 2025-06-29
-- Purpose: Consolidate pattern storage in preparation for removing conversation tables

BEGIN;

-- =====================================================================
-- PART 1: MIGRATE PATTERNS TO PARTICIPANTS.METADATA
-- =====================================================================

-- First, let's see what patterns exist
CREATE TEMP TABLE pattern_migration_status AS
SELECT 
  cp.participant_id,
  p.name as participant_name,
  cp.conversation_id,
  cp.participant_patterns,
  p.metadata as current_metadata,
  CASE 
    WHEN cp.participant_patterns IS NULL OR cp.participant_patterns = '{}'::jsonb THEN 'empty'
    ELSE 'has_patterns'
  END as pattern_status
FROM conversation_participants cp
JOIN participants p ON cp.participant_id = p.id
WHERE cp.participant_patterns IS NOT NULL;

-- Log migration intent
DO $$
DECLARE
  pattern_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pattern_count 
  FROM pattern_migration_status 
  WHERE pattern_status = 'has_patterns';
  
  RAISE NOTICE 'Found % participants with patterns to migrate', pattern_count;
END $$;

-- Merge patterns into participants.metadata
-- We'll store patterns under a 'patterns' key in metadata
UPDATE participants p
SET metadata = 
  CASE 
    WHEN p.metadata IS NULL THEN 
      jsonb_build_object('patterns', agg.merged_patterns)
    WHEN p.metadata ? 'patterns' THEN
      p.metadata || jsonb_build_object('patterns', p.metadata->'patterns' || agg.merged_patterns)
    ELSE 
      p.metadata || jsonb_build_object('patterns', agg.merged_patterns)
  END,
  updated_at = NOW()
FROM (
  SELECT 
    participant_id,
    jsonb_object_agg(
      COALESCE('conversation_' || conversation_id::text, 'general'),
      participant_patterns
    ) as merged_patterns
  FROM conversation_participants
  WHERE participant_patterns IS NOT NULL 
    AND participant_patterns != '{}'::jsonb
  GROUP BY participant_id
) agg
WHERE p.id = agg.participant_id;

-- =====================================================================
-- PART 2: CREATE HELPER FUNCTIONS FOR PATTERN ACCESS
-- =====================================================================

-- Drop existing functions if they exist with different signatures
DROP FUNCTION IF EXISTS get_participant_patterns(BIGINT);
DROP FUNCTION IF EXISTS update_participant_patterns(BIGINT, TEXT, JSONB);

-- Function to get patterns for a participant
CREATE FUNCTION get_participant_patterns(participant_id BIGINT)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT COALESCE(metadata->'patterns', '{}'::jsonb)
    FROM participants
    WHERE id = participant_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update patterns for a participant
CREATE FUNCTION update_participant_patterns(
  participant_id BIGINT,
  pattern_key TEXT,
  pattern_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  current_patterns JSONB;
  new_patterns JSONB;
BEGIN
  -- Get current patterns
  SELECT COALESCE(metadata->'patterns', '{}'::jsonb) 
  INTO current_patterns
  FROM participants 
  WHERE id = participant_id;
  
  -- If participant not found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update patterns
  new_patterns := current_patterns || jsonb_build_object(pattern_key, pattern_data);
  
  -- Update metadata
  UPDATE participants
  SET 
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('patterns', new_patterns),
    updated_at = NOW()
  WHERE id = participant_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 3: VERIFICATION
-- =====================================================================

-- Create verification view
CREATE OR REPLACE VIEW participant_patterns_view AS
SELECT 
  p.id,
  p.name,
  p.metadata->'patterns' as patterns,
  jsonb_object_keys(COALESCE(p.metadata->'patterns', '{}'::jsonb)) as pattern_keys
FROM participants p
WHERE p.metadata->'patterns' IS NOT NULL;

-- Verify migration success
DO $$
DECLARE
  migrated_count INTEGER;
  original_count INTEGER;
BEGIN
  -- Count successfully migrated patterns
  SELECT COUNT(DISTINCT participant_id) INTO migrated_count
  FROM participant_patterns_view;
  
  -- Count original patterns
  SELECT COUNT(DISTINCT participant_id) INTO original_count
  FROM conversation_participants
  WHERE participant_patterns IS NOT NULL 
    AND participant_patterns != '{}'::jsonb;
  
  RAISE NOTICE 'Migration complete: % of % participants migrated', migrated_count, original_count;
  
  IF migrated_count != original_count THEN
    RAISE WARNING 'Pattern count mismatch! Check pattern_migration_status table';
  END IF;
END $$;

-- =====================================================================
-- PART 4: UPDATE EXISTING HELPER FUNCTIONS
-- =====================================================================

-- These functions were mentioned in CLAUDE.md, let's ensure they work with new structure

-- Override the find_participant_id function to ensure it still works
CREATE OR REPLACE FUNCTION find_participant_id(identifier TEXT)
RETURNS BIGINT AS $$
DECLARE
  participant_id BIGINT;
BEGIN
  -- Try by name first
  SELECT id INTO participant_id
  FROM participants
  WHERE name = identifier
  LIMIT 1;
  
  IF participant_id IS NOT NULL THEN
    RETURN participant_id;
  END IF;
  
  -- Try by email (assuming email might be in metadata)
  SELECT id INTO participant_id
  FROM participants
  WHERE metadata->>'email' = identifier
  LIMIT 1;
  
  RETURN participant_id;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate helper for pattern management scripts compatibility
DROP FUNCTION IF EXISTS get_conversation_participant_patterns(BIGINT, BIGINT);

CREATE FUNCTION get_conversation_participant_patterns(
  conversation_id BIGINT,
  participant_id BIGINT
)
RETURNS JSONB AS $$
BEGIN
  -- This provides backwards compatibility for scripts expecting conversation-specific patterns
  RETURN (
    SELECT metadata->'patterns'->('conversation_' || conversation_id::text)
    FROM participants
    WHERE id = participant_id
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 5: CLEANUP
-- =====================================================================

-- Don't drop tables yet, but create a backup view for safety
CREATE OR REPLACE VIEW conversation_participants_backup AS
SELECT * FROM conversation_participants
WHERE participant_patterns IS NOT NULL 
  AND participant_patterns != '{}'::jsonb;

-- Add comment to track migration
COMMENT ON VIEW participant_patterns_view IS 'Shows migrated participant patterns from conversation_participants table - Migration 007';

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- After running this migration:
-- 1. Update all scripts that reference conversation_participants.participant_patterns to use:
--    - get_participant_patterns(participant_id) function
--    - update_participant_patterns(participant_id, key, data) function
-- 2. Test pattern management scripts with new structure
-- 3. Once verified, conversation_participants table can be dropped in next migration