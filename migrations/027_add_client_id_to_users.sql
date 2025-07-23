-- Migration: Add client_id to client_mgmt.users table
-- Date: 2025-07-23
-- Description: Add client_id column to users table to link users to their client organizations

BEGIN;

-- Add client_id column to users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users'
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE client_mgmt.users ADD COLUMN client_id INTEGER;
    END IF;
END $$;

-- Add foreign key constraint to client_mgmt.clients (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'client_mgmt' 
        AND table_name = 'users' 
        AND constraint_name = 'fk_users_client_id'
    ) THEN
        ALTER TABLE client_mgmt.users 
        ADD CONSTRAINT fk_users_client_id 
        FOREIGN KEY (client_id) REFERENCES client_mgmt.clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_client_id ON client_mgmt.users(client_id);

-- Update existing users to have a default client_id (assuming client_id = 1 exists)
-- This is for existing data migration - in production you'd want to handle this more carefully
UPDATE client_mgmt.users 
SET client_id = 1 
WHERE client_id IS NULL 
AND EXISTS (SELECT 1 FROM client_mgmt.clients WHERE id = 1);

-- Add comment
COMMENT ON COLUMN client_mgmt.users.client_id IS 'Foreign key to client_mgmt.clients - associates users with their client organization';

COMMIT;