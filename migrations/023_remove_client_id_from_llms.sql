-- Remove client_id from llms table for site-wide API keys
-- Migration: 023_remove_client_id_from_llms.sql

-- Drop the foreign key constraint first (if it exists)
ALTER TABLE client_mgmt.llms DROP CONSTRAINT IF EXISTS llms_client_id_fkey;

-- Remove the client_id column
ALTER TABLE client_mgmt.llms DROP COLUMN IF EXISTS client_id;

-- Add a comment to document the change
COMMENT ON TABLE client_mgmt.llms IS 'Site-wide LLM configurations with API keys (no longer client-specific)';