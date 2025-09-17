-- Remove meeting_index field as it's replaced by turn_index
-- turn_index provides better flexibility for insertable ordering

BEGIN;

-- Drop the meeting_index column
ALTER TABLE meetings.turns
DROP COLUMN IF EXISTS meeting_index;

-- Log the change
COMMENT ON COLUMN meetings.turns.turn_index IS 
'Float index for custom message ordering. Replaces the old meeting_index field.
Allows insertion between messages using fractional values. 
Example: To insert between index 1.0 and 2.0, use 1.5';

COMMIT;

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Removed meeting_index field from turns table (replaced by turn_index)';
END $$;