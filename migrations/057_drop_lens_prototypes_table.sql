-- Migration: Drop lens_prototypes table
-- This table contained conceptual analysis framework templates but was never actively used.
-- The lens analysis concept (genome, attractor, thread, crystal, meeting_roles) remains conceptual
-- but goes against the principle that analysis should be done on-the-fly by LLMs rather than 
-- using pre-defined templates stored in the database.

BEGIN;

-- Drop the lens_prototypes table
DROP TABLE IF EXISTS conversation.lens_prototypes CASCADE;

-- Note: The applyLensesToBlock method in conversation-pattern-analyzer.js is just a TODO placeholder
-- and was never implemented to actually use these prototypes

COMMIT;