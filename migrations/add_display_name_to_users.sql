-- Add display_name column to users table for human-readable names
BEGIN;

-- Add display_name column
ALTER TABLE client_mgmt.users
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Set initial display names from email (before @ symbol)
UPDATE client_mgmt.users
SET display_name = SPLIT_PART(email, '@', 1)
WHERE display_name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN client_mgmt.users.display_name IS 'Human-readable display name for the user';

COMMIT;

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Added display_name column to users table';
END $$;