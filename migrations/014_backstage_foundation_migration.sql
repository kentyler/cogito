-- Migration 014: Backstage Foundation Migration - Users & Participants
-- Date: 2025-06-29  
-- Purpose: Migrate backstage participants to cogito's client_mgmt.users + conversation.participants

BEGIN;

-- =====================================================================
-- PART 1: CREATE EXTENSION FOR CROSS-DATABASE QUERIES (IF NEEDED)
-- =====================================================================

-- Note: This migration assumes backstage data will be imported via application code
-- or via data export/import rather than direct cross-database queries

-- =====================================================================
-- PART 2: CREATE CLIENT RECORDS FOR EXISTING BACKSTAGE CLIENTS
-- =====================================================================

-- Insert known backstage clients into client_mgmt.clients (handle conflicts gracefully)
INSERT INTO client_mgmt.clients (id, name, metadata) VALUES 
(101, 'Development', '{"backstage_schema": "dev", "migrated_from": "backstage"}'),
(102, 'BSA', '{"backstage_schema": "bsa", "migrated_from": "backstage"}'),
(103, 'Conflict Club', '{"backstage_schema": "conflict_club", "migrated_from": "backstage"}'),
(104, 'First Congregational', '{"backstage_schema": "first_congregational", "migrated_from": "backstage"}'),
(105, 'Time That Remains', '{"backstage_schema": "timethatremains", "migrated_from": "backstage"}')
ON CONFLICT (name) DO UPDATE SET 
  metadata = EXCLUDED.metadata || jsonb_build_object('migration_updated', NOW());

-- =====================================================================
-- PART 3: CREATE TEMPORARY STAGING TABLE FOR BACKSTAGE DATA
-- =====================================================================

-- Temporary table to hold backstage participant data during migration
CREATE TEMP TABLE backstage_participants_staging (
  original_id BIGINT,
  name TEXT,
  email TEXT,
  password_hash TEXT,
  client_id INTEGER,
  schema_name TEXT,
  llm_config JSONB,
  custom_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================================
-- PART 4: HELPER FUNCTIONS FOR MIGRATION
-- =====================================================================

-- Function to migrate a single backstage participant
CREATE OR REPLACE FUNCTION migrate_backstage_participant(
  p_original_id BIGINT,
  p_name TEXT,
  p_email TEXT,
  p_password_hash TEXT,
  p_client_id INTEGER,
  p_schema_name TEXT,
  p_llm_config JSONB DEFAULT NULL,
  p_custom_instructions TEXT DEFAULT NULL,
  p_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(user_id UUID, participant_id BIGINT) AS $$
DECLARE
  new_user_id UUID;
  new_participant_id BIGINT;
BEGIN
  -- Create user in client_mgmt.users
  INSERT INTO client_mgmt.users (email, client_id, password_hash, metadata, created_at)
  VALUES (
    p_email,
    p_client_id,
    p_password_hash,
    jsonb_build_object(
      'migrated_from', 'backstage',
      'original_id', p_original_id,
      'schema_name', p_schema_name,
      'migration_date', NOW()
    ),
    p_created_at
  )
  RETURNING id INTO new_user_id;
  
  -- Create participant in conversation.participants
  INSERT INTO conversation.participants (user_id, name, type, metadata, created_at)
  VALUES (
    new_user_id,
    p_name,
    'human',
    jsonb_build_object(
      'migrated_from', 'backstage',
      'original_id', p_original_id,
      'client_id', p_client_id,
      'schema_name', p_schema_name,
      'llm_config', p_llm_config,
      'custom_instructions', p_custom_instructions,
      'migration_date', NOW()
    ),
    p_created_at
  )
  RETURNING id INTO new_participant_id;
  
  RETURN QUERY SELECT new_user_id, new_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find migrated participant by original backstage ID
CREATE OR REPLACE FUNCTION find_migrated_participant(
  p_original_id BIGINT,
  p_schema_name TEXT
)
RETURNS BIGINT AS $$
DECLARE
  participant_id BIGINT;
BEGIN
  SELECT id INTO participant_id
  FROM conversation.participants
  WHERE metadata->>'original_id' = p_original_id::text
    AND metadata->>'schema_name' = p_schema_name;
    
  RETURN participant_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 5: CREATE VIEWS FOR MIGRATION STATUS
-- =====================================================================

-- View to track migration progress
CREATE OR REPLACE VIEW backstage_migration_status AS
SELECT 
  c.name as client_name,
  c.metadata->>'backstage_schema' as schema_name,
  COUNT(DISTINCT u.id) as migrated_users,
  COUNT(DISTINCT p.id) as migrated_participants
FROM client_mgmt.clients c
LEFT JOIN client_mgmt.users u ON u.client_id = c.id 
  AND u.metadata->>'migrated_from' = 'backstage'
LEFT JOIN conversation.participants p ON p.metadata->>'migrated_from' = 'backstage'
  AND p.metadata->>'client_id' = c.id::text
WHERE c.metadata->>'migrated_from' = 'backstage'
GROUP BY c.id, c.name, c.metadata->>'backstage_schema';

-- =====================================================================
-- PART 6: GRANT PERMISSIONS
-- =====================================================================

-- Grant permissions on new functions
GRANT EXECUTE ON FUNCTION migrate_backstage_participant TO PUBLIC;
GRANT EXECUTE ON FUNCTION find_migrated_participant TO PUBLIC;

-- =====================================================================
-- PART 7: VERIFICATION & LOGGING
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE 'Backstage foundation migration setup complete';
  RAISE NOTICE 'Clients created: %', (SELECT COUNT(*) FROM client_mgmt.clients WHERE metadata->>'migrated_from' = 'backstage');
  RAISE NOTICE 'Migration helper functions created';
  RAISE NOTICE 'Ready for participant data import';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Export backstage participant data';
  RAISE NOTICE '2. Use migrate_backstage_participant() function to import';
  RAISE NOTICE '3. Verify migration with backstage_migration_status view';
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- To use this migration:
--
-- 1. Export backstage participant data:
--    SELECT id, name, email, password, client_schema, llm_config, custom_instructions, created_at
--    FROM backstage.public.participants;
--
-- 2. For each participant, call:
--    SELECT migrate_backstage_participant(
--      original_id := 123,
--      name := 'John Doe', 
--      email := 'john@example.com',
--      password_hash := 'hashed_password',
--      client_id := 1, -- Map schema to client_id
--      schema_name := 'dev',
--      llm_config := '{"model": "gpt-4"}',
--      custom_instructions := 'Custom instructions...',
--      created_at := '2024-01-01 00:00:00+00'
--    );
--
-- 3. Check progress:
--    SELECT * FROM backstage_migration_status;
--
-- 4. Find migrated participants:
--    SELECT find_migrated_participant(original_id, 'schema_name');