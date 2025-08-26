-- Migration: Drop detected_patterns table
-- This table was part of an older pattern detection architecture that stored analysis results.
-- The new architecture stores patterns as JSONB in participants.patterns field and follows
-- the principle that analysis should be done on-the-fly by LLMs rather than pre-computed and stored.

BEGIN;

-- Drop the detected_patterns table and its sequence
DROP TABLE IF EXISTS conversation.detected_patterns CASCADE;

-- Note: The sequence detected_patterns_id_seq will be automatically dropped with CASCADE
-- Note: pattern_types and participant_patterns tables are preserved for now as they may still be referenced

COMMIT;