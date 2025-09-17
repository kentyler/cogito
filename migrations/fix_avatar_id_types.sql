-- Fix Avatar ID Type Mismatch
-- The avatar system was designed to use VARCHAR IDs but some columns were incorrectly created as INTEGER

-- Fix last_avatar_id in users table to match avatar IDs (VARCHAR)
DO $$
BEGIN
    -- Check if the column exists and is INTEGER type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users' 
        AND column_name = 'last_avatar_id'
        AND data_type = 'integer'
    ) THEN
        -- Drop the foreign key constraint if it exists
        ALTER TABLE client_mgmt.users DROP CONSTRAINT IF EXISTS users_last_avatar_id_fkey;
        
        -- Change column type to VARCHAR to match avatars.id
        ALTER TABLE client_mgmt.users ALTER COLUMN last_avatar_id TYPE VARCHAR;
        
        -- Re-add the foreign key constraint
        ALTER TABLE client_mgmt.users 
        ADD CONSTRAINT users_last_avatar_id_fkey 
        FOREIGN KEY (last_avatar_id) REFERENCES client_mgmt.avatars(id);
        
        RAISE NOTICE 'Fixed last_avatar_id column type from INTEGER to VARCHAR';
    ELSE
        RAISE NOTICE 'last_avatar_id column is already VARCHAR or does not exist';
    END IF;
END $$;

-- Fix avatar_id in turns table to match avatar IDs (VARCHAR)
DO $$
BEGIN
    -- Check if the column exists and is INTEGER type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'meetings' 
        AND table_name = 'turns' 
        AND column_name = 'avatar_id'
        AND data_type = 'integer'
    ) THEN
        -- Drop the foreign key constraint if it exists
        ALTER TABLE meetings.turns DROP CONSTRAINT IF EXISTS turns_avatar_id_fkey;
        
        -- Change column type to VARCHAR to match avatars.id
        ALTER TABLE meetings.turns ALTER COLUMN avatar_id TYPE VARCHAR;
        
        -- Re-add the foreign key constraint
        ALTER TABLE meetings.turns 
        ADD CONSTRAINT turns_avatar_id_fkey 
        FOREIGN KEY (avatar_id) REFERENCES client_mgmt.avatars(id);
        
        RAISE NOTICE 'Fixed avatar_id column type in turns table from INTEGER to VARCHAR';
    ELSE
        RAISE NOTICE 'avatar_id column in turns table is already VARCHAR or does not exist';
    END IF;
END $$;