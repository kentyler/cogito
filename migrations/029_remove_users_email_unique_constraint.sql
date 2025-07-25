-- Migration: Remove unique email constraint from users table
-- This allows multiple users to have the same email address (e.g., for different clients)

-- Drop the unique constraint
ALTER TABLE client_mgmt.users 
DROP CONSTRAINT IF EXISTS users_email_key;

-- The regular index idx_users_email will remain for query performance
-- This provides fast lookups without enforcing uniqueness

-- Add a comment explaining the change
COMMENT ON TABLE client_mgmt.users IS 'User accounts - email is no longer unique to support multi-tenant scenarios where the same email can exist for different clients';