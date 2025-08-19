-- Migration: Add OAuth support to users table
-- This allows users to sign in via OAuth without requiring a password

-- Add name column for OAuth users (they might not have set a username)
ALTER TABLE client_mgmt.users 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Make password_hash nullable to support OAuth-only users
ALTER TABLE client_mgmt.users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Add index on email for faster OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON client_mgmt.users (LOWER(TRIM(email)));

-- Update metadata column comment to document OAuth fields
COMMENT ON COLUMN client_mgmt.users.metadata IS 'User metadata including OAuth info: oauth_provider, oauth_provider_id, picture, email_verified, created_via, last_login, last_oauth_login';

-- Add check constraint to ensure users have either password or OAuth provider
ALTER TABLE client_mgmt.users
ADD CONSTRAINT users_auth_method_check
CHECK (
    password_hash IS NOT NULL OR 
    (metadata->>'oauth_provider') IS NOT NULL
);