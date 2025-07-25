-- Migration: Remove client_id from users table
-- Now that we have user_clients junction table, users.client_id is redundant

-- Drop the foreign key constraint first
ALTER TABLE client_mgmt.users 
DROP CONSTRAINT IF EXISTS fk_users_client_id;

-- Drop the index on client_id
DROP INDEX IF EXISTS client_mgmt.idx_users_client_id;

-- Remove the client_id column
ALTER TABLE client_mgmt.users 
DROP COLUMN IF EXISTS client_id;

-- Update table comment to reflect new structure
COMMENT ON TABLE client_mgmt.users IS 'User accounts - client associations now managed through user_clients junction table';

-- Report the change
DO $$
DECLARE
    user_count INTEGER;
    relationship_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM client_mgmt.users;
    SELECT COUNT(*) INTO relationship_count FROM client_mgmt.user_clients;
    
    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '  - Removed client_id from users table';
    RAISE NOTICE '  - % users now use user_clients for client associations', user_count;
    RAISE NOTICE '  - % user-client relationships maintained', relationship_count;
END $$;