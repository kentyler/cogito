-- Remove foreign key constraint to allow optional meetings
BEGIN;

-- Drop the foreign key constraint on turns.meeting_id
ALTER TABLE meetings.turns 
DROP CONSTRAINT IF EXISTS turns_meeting_ref_id_fkey;

-- Add comment explaining the change
COMMENT ON COLUMN meetings.turns.meeting_id IS 'Optional meeting reference - null for standalone turns (e.g. Talk tab)';

COMMIT;

-- Log the change
DO $$
BEGIN
    RAISE NOTICE 'Removed foreign key constraint turns_meeting_ref_id_fkey to allow optional meetings';
END $$;