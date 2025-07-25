-- Migration: Create user_clients junction table for many-to-many user-client relationships
-- This allows a single user to belong to multiple clients without duplicating user records

-- Create the user_clients table
CREATE TABLE client_mgmt.user_clients (
    user_id BIGINT NOT NULL REFERENCES client_mgmt.users(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- member, admin, owner, etc.
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (user_id, client_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_clients_user_id ON client_mgmt.user_clients(user_id);
CREATE INDEX idx_user_clients_client_id ON client_mgmt.user_clients(client_id);
CREATE INDEX idx_user_clients_active ON client_mgmt.user_clients(is_active) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE client_mgmt.user_clients IS 'Junction table linking users to clients - enables multi-tenant access';
COMMENT ON COLUMN client_mgmt.user_clients.role IS 'User role within this client context';
COMMENT ON COLUMN client_mgmt.user_clients.joined_at IS 'When the user was added to this client';

-- Migrate existing user-client relationships
-- For each user that has a client_id, create a record in user_clients
INSERT INTO client_mgmt.user_clients (user_id, client_id, role, joined_at)
SELECT 
    id as user_id,
    client_id,
    CASE 
        WHEN email = 'ken@example.com' THEN 'owner'
        ELSE 'member'
    END as role,
    created_at as joined_at
FROM client_mgmt.users
WHERE client_id IS NOT NULL
ON CONFLICT (user_id, client_id) DO NOTHING;

-- Now we need to handle the case where users might have duplicate emails
-- First, let's identify duplicate emails
CREATE TEMP TABLE duplicate_emails AS
SELECT email, COUNT(*) as count
FROM client_mgmt.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- For each duplicate email, we'll keep the oldest user and merge the others
DO $$
DECLARE
    dup_email RECORD;
    primary_user_id BIGINT;
    dup_user RECORD;
BEGIN
    -- Process each duplicate email
    FOR dup_email IN SELECT * FROM duplicate_emails
    LOOP
        -- Find the primary user (oldest created_at)
        SELECT id INTO primary_user_id
        FROM client_mgmt.users
        WHERE email = dup_email.email
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- For each duplicate user (not the primary)
        FOR dup_user IN 
            SELECT id, client_id 
            FROM client_mgmt.users 
            WHERE email = dup_email.email 
              AND id != primary_user_id
        LOOP
            -- Add their client relationship to the primary user
            INSERT INTO client_mgmt.user_clients (user_id, client_id, role, joined_at)
            VALUES (primary_user_id, dup_user.client_id, 'member', NOW())
            ON CONFLICT (user_id, client_id) DO NOTHING;
            
            -- We'll handle deletion of duplicate users in a separate step
            -- For now, just mark them
            UPDATE client_mgmt.users 
            SET metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{duplicate_of}',
                to_jsonb(primary_user_id)
            )
            WHERE id = dup_user.id;
        END LOOP;
        
        RAISE NOTICE 'Processed duplicate email: % (primary user: %)', dup_email.email, primary_user_id;
    END LOOP;
END $$;

-- Drop the temp table
DROP TABLE duplicate_emails;

-- Now add the unique constraint back on email
ALTER TABLE client_mgmt.users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Report on what was done
SELECT 
    'Migration complete. Created user_clients table with ' || COUNT(*) || ' relationships.' as status
FROM client_mgmt.user_clients;

SELECT 
    'Found ' || COUNT(*) || ' duplicate users marked for cleanup.' as duplicates
FROM client_mgmt.users
WHERE metadata->>'duplicate_of' IS NOT NULL;