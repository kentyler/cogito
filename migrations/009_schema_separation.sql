-- Migration 009: Schema Separation
-- Date: 2025-06-29
-- Purpose: Separate client management from conversation data into different schemas

BEGIN;

-- =====================================================================
-- PART 1: CREATE NEW SCHEMAS
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS client_mgmt;
CREATE SCHEMA IF NOT EXISTS conversation;

-- =====================================================================
-- PART 2: MOVE CLIENT MANAGEMENT TABLES TO client_mgmt SCHEMA
-- =====================================================================

-- Core client/user tables
ALTER TABLE clients SET SCHEMA client_mgmt;
ALTER TABLE users SET SCHEMA client_mgmt;
ALTER TABLE projects SET SCHEMA client_mgmt;

-- LLM configuration tables
ALTER TABLE llms SET SCHEMA client_mgmt;
ALTER TABLE llm_types SET SCHEMA client_mgmt;
ALTER TABLE client_llms SET SCHEMA client_mgmt;

-- Prompt management
ALTER TABLE client_prompts SET SCHEMA client_mgmt;

-- File management (client-scoped)
ALTER TABLE file_types SET SCHEMA client_mgmt;
ALTER TABLE file_uploads SET SCHEMA client_mgmt;
ALTER TABLE file_upload_vectors SET SCHEMA client_mgmt;

-- Event logging (client-scoped)
ALTER TABLE participant_event_categories SET SCHEMA client_mgmt;
ALTER TABLE participant_event_types SET SCHEMA client_mgmt;
ALTER TABLE participant_event_logs SET SCHEMA client_mgmt;
ALTER TABLE participant_events SET SCHEMA client_mgmt;

-- Topic management (client-scoped)
ALTER TABLE topic_paths SET SCHEMA client_mgmt;

-- =====================================================================
-- PART 3: MOVE CONVERSATION TABLES TO conversation SCHEMA
-- =====================================================================

-- Core conversation tables
ALTER TABLE participants SET SCHEMA conversation;
ALTER TABLE turns SET SCHEMA conversation;
ALTER TABLE blocks SET SCHEMA conversation;
ALTER TABLE block_turns SET SCHEMA conversation;

-- Participant connections and patterns
ALTER TABLE participant_connections SET SCHEMA conversation;
ALTER TABLE participant_patterns SET SCHEMA conversation;
ALTER TABLE participant_llms SET SCHEMA conversation;

-- Lens analysis system
ALTER TABLE lens_prototypes SET SCHEMA conversation;
ALTER TABLE block_lens_version SET SCHEMA conversation;

-- Pattern detection system
ALTER TABLE pattern_types SET SCHEMA conversation;
ALTER TABLE detected_patterns SET SCHEMA conversation;

-- Personality system
ALTER TABLE personalities SET SCHEMA conversation;
ALTER TABLE personality_evolutions SET SCHEMA conversation;

-- Thinking processes and insights
ALTER TABLE thinking_processes SET SCHEMA conversation;
ALTER TABLE analytical_insights SET SCHEMA conversation;
ALTER TABLE concept_connections SET SCHEMA conversation;

-- =====================================================================
-- PART 4: HANDLE TABLES THAT STAY IN PUBLIC
-- =====================================================================

-- Keep utility/location tables in public schema
-- locations - general utility table

-- Keep backup table in public
-- conversation_tables_final_backup - backup data

-- =====================================================================
-- PART 5: UPDATE FOREIGN KEY REFERENCES FOR CROSS-SCHEMA
-- =====================================================================

-- Update foreign keys that now cross schemas
-- Note: PostgreSQL supports cross-schema foreign keys

-- participants.user_id -> client_mgmt.users.id
-- This FK should continue to work across schemas

-- blocks with project_id reference
-- Any blocks that reference projects need updating
-- (Check if this column exists and update accordingly)

-- =====================================================================
-- PART 6: CREATE CROSS-SCHEMA VIEWS
-- =====================================================================

-- View to join participants with their user info
CREATE OR REPLACE VIEW public.participant_users AS
SELECT 
  p.*,
  u.email,
  u.client_id,
  u.created_at as user_created_at,
  u.is_active as user_active
FROM conversation.participants p
LEFT JOIN client_mgmt.users u ON p.user_id = u.id;

-- View to show blocks with client context
CREATE OR REPLACE VIEW public.client_blocks AS
SELECT 
  b.*,
  pr.name as project_name,
  pr.client_id,
  c.name as client_name
FROM conversation.blocks b
LEFT JOIN client_mgmt.projects pr ON (b.metadata->>'project_id')::bigint = pr.id
LEFT JOIN client_mgmt.clients c ON pr.client_id = c.id;

-- View for participant with client access
CREATE OR REPLACE VIEW public.participant_access AS
SELECT 
  p.id as participant_id,
  p.name as participant_name,
  u.email,
  u.client_id,
  c.name as client_name,
  pr.id as project_id,
  pr.name as project_name
FROM conversation.participants p
JOIN client_mgmt.users u ON p.user_id = u.id
JOIN client_mgmt.clients c ON u.client_id = c.id
LEFT JOIN client_mgmt.projects pr ON pr.client_id = c.id;

-- =====================================================================
-- PART 7: UPDATE SEARCH PATHS
-- =====================================================================

-- Set default search path to include both schemas for current session
-- This allows unqualified table names to work in most cases
SET search_path = public, conversation, client_mgmt;

-- =====================================================================
-- PART 8: GRANT PERMISSIONS
-- =====================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA client_mgmt TO PUBLIC;
GRANT USAGE ON SCHEMA conversation TO PUBLIC;

-- Grant permissions on tables (inherit from public schema permissions)
GRANT ALL ON ALL TABLES IN SCHEMA client_mgmt TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA conversation TO PUBLIC;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA client_mgmt TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA conversation TO PUBLIC;

-- =====================================================================
-- PART 9: UPDATE COMMENTS
-- =====================================================================

COMMENT ON SCHEMA client_mgmt IS 'Client management: users, billing, projects, LLM configs';
COMMENT ON SCHEMA conversation IS 'Conversation data: participants, turns, blocks, analysis';

-- Add comments to key cross-schema relationships
COMMENT ON COLUMN conversation.participants.user_id IS 'References client_mgmt.users.id';

-- =====================================================================
-- PART 10: VERIFICATION
-- =====================================================================

DO $$
DECLARE
  client_tables INTEGER;
  conversation_tables INTEGER;
  public_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_tables FROM information_schema.tables WHERE table_schema = 'client_mgmt';
  SELECT COUNT(*) INTO conversation_tables FROM information_schema.tables WHERE table_schema = 'conversation';
  SELECT COUNT(*) INTO public_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE 'Schema separation complete:';
  RAISE NOTICE '  client_mgmt schema: % tables', client_tables;
  RAISE NOTICE '  conversation schema: % tables', conversation_tables;
  RAISE NOTICE '  public schema: % tables remaining', public_tables;
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- After this migration:
-- 1. Tables are separated into logical schemas
-- 2. Cross-schema foreign keys still work
-- 3. Views provide convenient cross-schema joins
-- 4. Search path allows unqualified table names to work
-- 5. Application code may need schema prefixes for clarity

-- To use specific schemas in queries:
-- SELECT * FROM client_mgmt.users;
-- SELECT * FROM conversation.participants;
-- SELECT * FROM public.participant_users; -- cross-schema view