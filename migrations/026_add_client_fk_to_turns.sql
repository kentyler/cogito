-- Migration: Add client_id column and foreign key constraint to turns table
-- Date: 2025-07-23
-- Description: Add client_id column and foreign key constraint to turns table

BEGIN;

-- Add client_id column to turns table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'conversation' 
        AND table_name = 'turns' 
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE conversation.turns ADD COLUMN client_id INTEGER;
    END IF;
END $$;

-- Add foreign key constraint to client_mgmt.clients (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'conversation' 
        AND table_name = 'turns' 
        AND constraint_name = 'fk_turns_client_id'
    ) THEN
        ALTER TABLE conversation.turns 
        ADD CONSTRAINT fk_turns_client_id 
        FOREIGN KEY (client_id) REFERENCES client_mgmt.clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_turns_client_id ON conversation.turns(client_id);

-- Update existing turns to have a default client_id (assuming client_id = 1 exists)
-- This is for existing data migration - in production you'd want to handle this more carefully
UPDATE conversation.turns 
SET client_id = 1 
WHERE client_id IS NULL 
AND EXISTS (SELECT 1 FROM client_mgmt.clients WHERE id = 1);

-- Add comment
COMMENT ON COLUMN conversation.turns.client_id IS 'Foreign key to client_mgmt.clients - scopes turns to specific clients';

COMMIT;