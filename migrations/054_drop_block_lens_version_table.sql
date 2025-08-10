-- Migration: Drop block_lens_version table
-- This table was created to store lens analysis results but goes against the principle 
-- that analysis should be done on-the-fly by LLMs rather than pre-computed and stored

BEGIN;

-- Drop the block_lens_version table
DROP TABLE IF EXISTS conversation.block_lens_version CASCADE;

-- Note: The lens_prototypes table is preserved as it contains template/configuration data
-- rather than analysis results, which aligns better with the architectural principles

COMMIT;