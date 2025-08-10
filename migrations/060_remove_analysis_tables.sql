-- Migration: Remove analysis and pattern tables
-- These tables stored pre-computed analysis results which goes against the principle
-- that analysis should be done on-the-fly by LLMs rather than pre-computed and stored.
-- Tables being removed:
-- - pattern_types: Pattern template definitions (6 rows)
-- - personalities: Stored personality analysis (13 rows) 
-- - personality_evolutions: Personality change tracking (1 row)
-- - thinking_processes: Process analysis storage (0 rows)

BEGIN;

-- Drop tables in dependency order to avoid foreign key issues
DROP TABLE IF EXISTS conversation.personality_evolutions CASCADE;
DROP TABLE IF EXISTS conversation.personalities CASCADE;
DROP TABLE IF EXISTS conversation.thinking_processes CASCADE;
DROP TABLE IF EXISTS conversation.pattern_types CASCADE;

-- Also remove any remaining references in participant_patterns table if it still exists
DROP TABLE IF EXISTS conversation.participant_patterns CASCADE;

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Analysis tables removal complete. System now relies on on-demand LLM analysis.';
    RAISE NOTICE 'Removed: pattern_types, personalities, personality_evolutions, thinking_processes';
END $$;

COMMIT;