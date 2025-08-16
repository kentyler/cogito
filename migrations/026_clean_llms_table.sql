-- Remove name and model fields from llms table since they're now in llm_models
-- Migration: 026_clean_llms_table.sql

-- Remove the name column (now in llm_models)
ALTER TABLE client_mgmt.llms DROP COLUMN IF EXISTS name;

-- Remove the model column (now in llm_models as model_id)
ALTER TABLE client_mgmt.llms DROP COLUMN IF EXISTS model;

-- Remove temperature and max_tokens (now in llm_models)
ALTER TABLE client_mgmt.llms DROP COLUMN IF EXISTS temperature;
ALTER TABLE client_mgmt.llms DROP COLUMN IF EXISTS max_tokens;

-- Add comment to document the new structure
COMMENT ON TABLE client_mgmt.llms IS 'LLM provider configurations with API keys (models stored in llm_models table)';