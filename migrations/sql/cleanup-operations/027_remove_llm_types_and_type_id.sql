-- Remove deprecated llm_types table and type_id column
-- Migration: 027_remove_llm_types_and_type_id.sql

-- Remove type_id column from llms table (no longer needed)
ALTER TABLE client_mgmt.llms DROP COLUMN IF EXISTS type_id;

-- Drop the deprecated llm_types table entirely
DROP TABLE IF EXISTS client_mgmt.llm_types;

-- Add comment
COMMENT ON TABLE client_mgmt.llms IS 'Site-wide LLM provider configurations (type_id removed, llm_types table removed)';