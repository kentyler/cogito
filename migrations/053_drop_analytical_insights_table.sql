-- Migration: Drop analytical_insights table
-- This table was created to store analysis results but goes against the principle 
-- that analysis should be done on-the-fly by LLMs rather than pre-computed and stored

BEGIN;

-- Drop the analytical_insights table and its sequence
DROP TABLE IF EXISTS conversation.analytical_insights CASCADE;

-- Note: The sequence analytical_insights_id_seq will be automatically dropped with CASCADE

COMMIT;