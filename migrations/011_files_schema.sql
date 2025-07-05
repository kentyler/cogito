-- Migration 011: Move File Tables to Files Schema
-- Date: 2025-06-29
-- Purpose: Separate file storage from client management

BEGIN;

-- =====================================================================
-- PART 1: CREATE FILES SCHEMA
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS files;

-- =====================================================================
-- PART 2: MOVE FILE TABLES TO files SCHEMA
-- =====================================================================

-- Move all file-related tables
ALTER TABLE client_mgmt.file_types SET SCHEMA files;
ALTER TABLE client_mgmt.file_uploads SET SCHEMA files;
ALTER TABLE client_mgmt.file_upload_vectors SET SCHEMA files;

-- =====================================================================
-- PART 3: GRANT PERMISSIONS
-- =====================================================================

-- Grant usage on files schema
GRANT USAGE ON SCHEMA files TO PUBLIC;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA files TO PUBLIC;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA files TO PUBLIC;

-- =====================================================================
-- PART 4: UPDATE COMMENTS
-- =====================================================================

COMMENT ON SCHEMA files IS 'File storage, uploads, and vectorization tables';

-- =====================================================================
-- PART 5: VERIFICATION
-- =====================================================================

DO $$
DECLARE
  client_tables INTEGER;
  conversation_tables INTEGER;
  event_tables INTEGER;
  file_tables INTEGER;
  public_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_tables FROM information_schema.tables WHERE table_schema = 'client_mgmt';
  SELECT COUNT(*) INTO conversation_tables FROM information_schema.tables WHERE table_schema = 'conversation';
  SELECT COUNT(*) INTO event_tables FROM information_schema.tables WHERE table_schema = 'events';
  SELECT COUNT(*) INTO file_tables FROM information_schema.tables WHERE table_schema = 'files';
  SELECT COUNT(*) INTO public_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE 'Schema organization refined:';
  RAISE NOTICE '  client_mgmt schema: % tables', client_tables;
  RAISE NOTICE '  conversation schema: % tables', conversation_tables;
  RAISE NOTICE '  events schema: % tables', event_tables;
  RAISE NOTICE '  files schema: % tables', file_tables;
  RAISE NOTICE '  public schema: % tables remaining', public_tables;
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- Final schema organization:
-- client_mgmt: clients, users, projects, LLM configs, prompts (pure business logic)
-- conversation: participants, turns, blocks, patterns, analysis (conversation data)
-- events: event logging and audit trail tables (audit infrastructure)
-- files: file storage, uploads, vectorization (file infrastructure)
-- public: utilities and cross-schema views