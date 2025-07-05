-- Migration 007: Migrate participant patterns from conversation_participants to participants.metadata
-- Date: 2025-06-29
-- Purpose: Consolidate pattern storage in preparation for removing conversation tables

BEGIN;

-- =====================================================================
-- PART 1: CHECK CURRENT STATE
-- =====================================================================

DO $$
DECLARE
  pattern_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pattern_count 
  FROM conversation_participants 
  WHERE participant_patterns IS NOT NULL 
    AND participant_patterns != '{}'::jsonb;
  
  RAISE NOTICE 'Found % records with patterns to migrate', pattern_count;
END $$;

-- =====================================================================
-- PART 2: MIGRATE ANY EXISTING PATTERNS
-- =====================================================================

-- Only update if there are actually patterns to migrate
UPDATE participants p
SET 
  metadata = 
    CASE 
      WHEN p.metadata IS NULL THEN 
        jsonb_build_object('patterns', cp.participant_patterns)
      WHEN p.metadata ? 'patterns' THEN
        p.metadata || jsonb_build_object('patterns', p.metadata->'patterns' || cp.participant_patterns)
      ELSE 
        p.metadata || jsonb_build_object('patterns', cp.participant_patterns)
    END,
  updated_at = NOW()
FROM conversation_participants cp
WHERE p.id = cp.participant_id
  AND cp.participant_patterns IS NOT NULL 
  AND cp.participant_patterns != '{}'::jsonb;

-- =====================================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- =====================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_participant_patterns(BIGINT);
DROP FUNCTION IF EXISTS update_participant_patterns(BIGINT, TEXT, JSONB);
DROP FUNCTION IF EXISTS get_conversation_participant_patterns(BIGINT, BIGINT);

-- Function to get patterns for a participant
CREATE FUNCTION get_participant_patterns(p_id BIGINT)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT COALESCE(metadata->'patterns', '{}'::jsonb)
    FROM participants
    WHERE id = p_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update patterns for a participant  
CREATE FUNCTION update_participant_patterns(
  p_id BIGINT,
  p_key TEXT,
  p_data JSONB
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
  WHERE id = p_id;
  
  -- If participant not found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update patterns
  new_patterns := current_patterns || jsonb_build_object(p_key, p_data);
  
  -- Update metadata
  UPDATE participants
  SET 
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('patterns', new_patterns),
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Backwards compatibility function
CREATE FUNCTION get_conversation_participant_patterns(
  p_conv_id BIGINT,
  p_part_id BIGINT  
)
RETURNS JSONB AS $$
BEGIN
  -- This provides backwards compatibility for scripts expecting conversation-specific patterns
  RETURN (
    SELECT metadata->'patterns'->('conversation_' || p_conv_id::text)
    FROM participants
    WHERE id = p_part_id
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 4: VERIFICATION
-- =====================================================================

-- Create verification view
CREATE OR REPLACE VIEW participant_patterns_view AS
SELECT 
  p.id,
  p.name,
  p.metadata->'patterns' as patterns
FROM participants p
WHERE p.metadata->'patterns' IS NOT NULL;

-- Show results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM participant_patterns_view;
  
  RAISE NOTICE 'Migration complete. % participants now have patterns in metadata', migrated_count;
END $$;

COMMIT;

-- =====================================================================
-- NOTES
-- =====================================================================
-- The helper functions from CLAUDE.md have been preserved and updated:
-- - find_participant_id() - already exists, no changes needed
-- - get_participant_id_by_name() - already exists, no changes needed  
-- - get_participant_id_by_email() - already exists, no changes needed
-- - update_participant_patterns() - created with new signature