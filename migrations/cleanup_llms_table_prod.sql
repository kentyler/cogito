-- Migration: Remove obsolete columns from client_mgmt.llms table in production
-- Date: 2025-09-03
-- Description: Remove columns that were moved to llm_models table

BEGIN;

-- Remove columns that were moved to llm_models table
ALTER TABLE client_mgmt.llms 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS model,
DROP COLUMN IF EXISTS temperature,
DROP COLUMN IF EXISTS max_tokens,
DROP COLUMN IF EXISTS client_id;

COMMIT;

-- Verification query (run separately to check):
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'client_mgmt' 
-- AND table_name = 'llms' 
-- ORDER BY ordinal_position;