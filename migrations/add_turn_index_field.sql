-- Add turn_index field for insertable message ordering
-- This allows inserting messages between existing ones using fractional indices

BEGIN;

-- Add turn_index column as FLOAT
ALTER TABLE meetings.turns
ADD COLUMN IF NOT EXISTS turn_index FLOAT;

-- Set initial values based on created_at timestamp
-- This preserves existing order while setting up the index system
UPDATE meetings.turns
SET turn_index = EXTRACT(EPOCH FROM created_at)
WHERE turn_index IS NULL;

-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_turns_turn_index 
ON meetings.turns(client_id, turn_index)
WHERE meeting_id IS NULL;  -- Optimize for Talk (meeting-less) conversations

-- Add comment for documentation
COMMENT ON COLUMN meetings.turns.turn_index IS 
'Float index for custom message ordering. Allows insertion between messages using fractional values. 
Example: To insert between index 1.0 and 2.0, use 1.5';

COMMIT;

-- Helper function to calculate insertion index
CREATE OR REPLACE FUNCTION meetings.calculate_insertion_index(
    before_index FLOAT,
    after_index FLOAT
) RETURNS FLOAT AS $$
BEGIN
    -- If inserting at the beginning
    IF before_index IS NULL AND after_index IS NOT NULL THEN
        RETURN after_index - 1.0;
    END IF;
    
    -- If inserting at the end
    IF after_index IS NULL AND before_index IS NOT NULL THEN
        RETURN before_index + 1.0;
    END IF;
    
    -- If inserting between two messages
    IF before_index IS NOT NULL AND after_index IS NOT NULL THEN
        RETURN (before_index + after_index) / 2.0;
    END IF;
    
    -- If no context (first message)
    RETURN EXTRACT(EPOCH FROM NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION meetings.calculate_insertion_index IS 
'Calculate the turn_index for inserting a message between two existing messages';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Added turn_index field to turns table for insertable message ordering';
END $$;