-- Remove client_id from llm_types table for site-wide LLM types
-- Migration: 024_remove_client_id_from_llm_types.sql

-- Drop the foreign key constraint first (if it exists)
ALTER TABLE client_mgmt.llm_types DROP CONSTRAINT IF EXISTS llm_types_client_id_fkey;

-- Remove the client_id column
ALTER TABLE client_mgmt.llm_types DROP COLUMN IF EXISTS client_id;

-- Add a comment to document the change
COMMENT ON TABLE client_mgmt.llm_types IS 'Site-wide LLM type definitions (no longer client-specific)';