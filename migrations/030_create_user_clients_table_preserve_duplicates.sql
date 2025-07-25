-- Migration: Create user_clients junction table while preserving duplicate email/password combinations
-- This maintains all existing user records and their client associations

-- Create the user_clients table
CREATE TABLE IF NOT EXISTS client_mgmt.user_clients (
    user_id BIGINT NOT NULL REFERENCES client_mgmt.users(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- member, admin, owner, etc.
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (user_id, client_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_clients_user_id ON client_mgmt.user_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clients_client_id ON client_mgmt.user_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_user_clients_active ON client_mgmt.user_clients(is_active) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE client_mgmt.user_clients IS 'Junction table linking users to clients - preserves duplicate email/password combinations';
COMMENT ON COLUMN client_mgmt.user_clients.role IS 'User role within this client context';
COMMENT ON COLUMN client_mgmt.user_clients.joined_at IS 'When the user was added to this client';

-- Migrate ALL existing user-client relationships
-- Each user record keeps its own client association
INSERT INTO client_mgmt.user_clients (user_id, client_id, role, joined_at)
SELECT 
    id as user_id,
    client_id,
    CASE 
        WHEN email IN ('ken@8thfold.com', 'ken@example.com') THEN 'owner'
        ELSE 'member'
    END as role,
    created_at as joined_at
FROM client_mgmt.users
WHERE client_id IS NOT NULL
ON CONFLICT (user_id, client_id) DO NOTHING;

-- Report on what was done
DO $$
DECLARE
    user_count INTEGER;
    relationship_count INTEGER;
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM client_mgmt.users;
    SELECT COUNT(*) INTO relationship_count FROM client_mgmt.user_clients;
    
    SELECT COUNT(DISTINCT email) INTO duplicate_count
    FROM (
        SELECT email, COUNT(*) as cnt 
        FROM client_mgmt.users 
        WHERE email IS NOT NULL
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) dups;
    
    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '  - Total users: %', user_count;
    RAISE NOTICE '  - User-client relationships created: %', relationship_count;
    RAISE NOTICE '  - Emails with duplicates: %', duplicate_count;
END $$;

-- Note: We are NOT adding a unique constraint on email
-- This preserves the ability to have multiple email/password combinations
-- Each combination can still access only its associated client