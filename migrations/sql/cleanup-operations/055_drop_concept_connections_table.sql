-- Migration: Drop concept_connections table
-- This table was created to store concept relationship analysis results but goes against 
-- the principle that analysis should be done on-the-fly by LLMs rather than pre-computed and stored

BEGIN;

-- Drop the concept_connections table and its sequence
DROP TABLE IF EXISTS conversation.concept_connections CASCADE;

-- Note: The sequence concept_connections_id_seq will be automatically dropped with CASCADE

COMMIT;