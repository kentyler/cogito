-- Migration: Remove participant concept entirely
-- This removes the participant-centric approach in favor of user-centric approach.
-- Turns will now only reference user_id (where available) rather than participant_id.
-- This aligns with the principle that analysis should be done on-the-fly rather than
-- tracking patterns for individual participants over time.

BEGIN;

-- Step 1: Remove participant_id column from turns table
ALTER TABLE conversation.turns 
  DROP CONSTRAINT IF EXISTS turns_participant_id_fkey,
  DROP COLUMN IF EXISTS participant_id;

-- Step 2: Drop all participant-related tables in dependency order

-- Drop tables that reference participants
DROP TABLE IF EXISTS conversation.participant_connections CASCADE;
DROP TABLE IF EXISTS conversation.participant_llms CASCADE; 
DROP TABLE IF EXISTS conversation.participant_patterns CASCADE;

-- Drop events tables that reference participants
DROP TABLE IF EXISTS events.participant_event_logs CASCADE;
DROP TABLE IF EXISTS events.participant_events CASCADE;
DROP TABLE IF EXISTS events.participant_event_categories CASCADE;
DROP TABLE IF EXISTS events.participant_event_types CASCADE;

-- Drop client management participant tables
DROP TABLE IF EXISTS client_mgmt.participant_invitations CASCADE;

-- Step 3: Drop the main participants table last
DROP TABLE IF EXISTS conversation.participants CASCADE;

-- Step 4: Drop the participant helper functions
DROP FUNCTION IF EXISTS update_participant_patterns(bigint, text, jsonb);
DROP FUNCTION IF EXISTS find_participant_id(text);
DROP FUNCTION IF EXISTS get_participant_id_by_name(text);
DROP FUNCTION IF EXISTS get_participant_id_by_email(text);

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Participant concept removal complete. System is now user-centric.';
    RAISE NOTICE 'Turns table now uses only user_id for identification where available.';
END $$;

COMMIT;