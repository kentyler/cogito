-- Migration 010: Move Event Tables to Events Schema
-- Date: 2025-06-29
-- Purpose: Separate event logging from client management

BEGIN;

-- =====================================================================
-- PART 1: CREATE EVENTS SCHEMA
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS events;

-- =====================================================================
-- PART 2: MOVE EVENT TABLES TO events SCHEMA
-- =====================================================================

-- Move all event-related tables
ALTER TABLE client_mgmt.participant_event_categories SET SCHEMA events;
ALTER TABLE client_mgmt.participant_event_types SET SCHEMA events;
ALTER TABLE client_mgmt.participant_event_logs SET SCHEMA events;
ALTER TABLE client_mgmt.participant_events SET SCHEMA events;

-- =====================================================================
-- PART 3: GRANT PERMISSIONS
-- =====================================================================

-- Grant usage on events schema
GRANT USAGE ON SCHEMA events TO PUBLIC;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA events TO PUBLIC;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA events TO PUBLIC;

-- =====================================================================
-- PART 4: UPDATE COMMENTS
-- =====================================================================

COMMENT ON SCHEMA events IS 'Event logging and audit trail tables';

-- =====================================================================
-- PART 5: VERIFICATION
-- =====================================================================

DO $$
DECLARE
  client_tables INTEGER;
  conversation_tables INTEGER;
  event_tables INTEGER;
  public_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_tables FROM information_schema.tables WHERE table_schema = 'client_mgmt';
  SELECT COUNT(*) INTO conversation_tables FROM information_schema.tables WHERE table_schema = 'conversation';
  SELECT COUNT(*) INTO event_tables FROM information_schema.tables WHERE table_schema = 'events';
  SELECT COUNT(*) INTO public_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE 'Schema organization updated:';
  RAISE NOTICE '  client_mgmt schema: % tables', client_tables;
  RAISE NOTICE '  conversation schema: % tables', conversation_tables;
  RAISE NOTICE '  events schema: % tables', event_tables;
  RAISE NOTICE '  public schema: % tables remaining', public_tables;
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- Final schema organization:
-- client_mgmt: clients, users, projects, LLM configs, prompts, file uploads
-- conversation: participants, turns, blocks, patterns, analysis
-- events: all event logging and audit trail tables
-- public: utilities and cross-schema views