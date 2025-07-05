-- Migration 012: Remove Rigid Project/Topic Structures
-- Date: 2025-06-29
-- Purpose: Remove projects and topic_paths tables in favor of metadata-based organization

BEGIN;

-- =====================================================================
-- PART 1: BACKUP DATA BEFORE REMOVAL
-- =====================================================================

-- Create backup of projects data in case there's important info
CREATE TABLE IF NOT EXISTS public.projects_backup AS
SELECT 
  'projects' as table_name,
  id as record_id,
  row_to_json(p.*) as data,
  NOW() as backup_timestamp
FROM client_mgmt.projects p;

-- Create backup of topic_paths data
CREATE TABLE IF NOT EXISTS public.topic_paths_backup AS
SELECT 
  'topic_paths' as table_name,
  id as record_id,
  row_to_json(tp.*) as data,
  NOW() as backup_timestamp
FROM client_mgmt.topic_paths tp;

-- =====================================================================
-- PART 2: DROP THE RIGID STRUCTURE TABLES
-- =====================================================================

-- Drop projects table (projects are now metadata tags)
DROP TABLE IF EXISTS client_mgmt.projects CASCADE;

-- Drop topic_paths table (topics are now metadata tags)
DROP TABLE IF EXISTS client_mgmt.topic_paths CASCADE;

-- =====================================================================
-- PART 3: UPDATE COMMENTS
-- =====================================================================

COMMENT ON TABLE public.projects_backup IS 'Backup of projects table before removal - projects now handled as metadata';
COMMENT ON TABLE public.topic_paths_backup IS 'Backup of topic_paths table before removal - topics now handled as metadata';

-- =====================================================================
-- PART 4: VERIFICATION
-- =====================================================================

DO $$
DECLARE
  client_tables INTEGER;
  conversation_tables INTEGER;
  event_tables INTEGER;
  file_tables INTEGER;
  public_tables INTEGER;
  projects_backup_count INTEGER;
  topics_backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_tables FROM information_schema.tables WHERE table_schema = 'client_mgmt';
  SELECT COUNT(*) INTO conversation_tables FROM information_schema.tables WHERE table_schema = 'conversation';
  SELECT COUNT(*) INTO event_tables FROM information_schema.tables WHERE table_schema = 'events';
  SELECT COUNT(*) INTO file_tables FROM information_schema.tables WHERE table_schema = 'files';
  SELECT COUNT(*) INTO public_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO projects_backup_count FROM public.projects_backup;
  SELECT COUNT(*) INTO topics_backup_count FROM public.topic_paths_backup;
  
  RAISE NOTICE 'Rigid structures removed - Pure schema organization achieved:';
  RAISE NOTICE '  client_mgmt schema: % tables (pure business logic)', client_tables;
  RAISE NOTICE '  conversation schema: % tables (content & analysis)', conversation_tables;
  RAISE NOTICE '  events schema: % tables (audit infrastructure)', event_tables;
  RAISE NOTICE '  files schema: % tables (file infrastructure)', file_tables;
  RAISE NOTICE '  public schema: % tables (utilities & backups)', public_tables;
  RAISE NOTICE '';
  RAISE NOTICE 'Data preserved:';
  RAISE NOTICE '  Projects backed up: % records', projects_backup_count;
  RAISE NOTICE '  Topic paths backed up: % records', topics_backup_count;
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- Final clean schema organization:
-- client_mgmt: clients, users, LLM configs, prompts (pure business logic)
-- conversation: participants, turns, blocks, patterns, analysis (content/analysis)
-- events: event logging (audit infrastructure)  
-- files: file storage (file infrastructure)
-- public: utilities and backups

-- Projects and topics are now handled as:
-- - metadata tags in blocks/turns: {"project": "weekly-meetings", "topic": "ai-ethics"}
-- - flexible, evolving, no rigid foreign key constraints
-- - human organizational concepts, not database structures