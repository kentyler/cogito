-- Make meeting_id optional and add client_id to turns table
-- This supports the new conversation-centric model where turns don't require meetings

BEGIN;

-- Add client_id column to turns table
ALTER TABLE meetings.turns
ADD COLUMN IF NOT EXISTS client_id BIGINT REFERENCES client_mgmt.clients(id);

-- Make meeting_id nullable (if it isn't already)
ALTER TABLE meetings.turns
ALTER COLUMN meeting_id DROP NOT NULL;

-- Add index for client_id queries
CREATE INDEX IF NOT EXISTS idx_turns_client_id ON meetings.turns(client_id);

-- Add index for client_id + timestamp for recent turns queries
CREATE INDEX IF NOT EXISTS idx_turns_client_timestamp ON meetings.turns(client_id, timestamp DESC);

-- Update existing turns to set client_id from their meetings
UPDATE meetings.turns t
SET client_id = m.client_id
FROM meetings.meetings m
WHERE t.meeting_id = m.id
AND t.client_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN meetings.turns.client_id IS 'Client ID for this turn. Allows turns without meetings for conversation-centric UI';
COMMENT ON COLUMN meetings.turns.meeting_id IS 'Optional meeting ID. Null for standalone conversation turns';

COMMIT;

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Made meeting_id optional and added client_id to turns table for conversation-centric model';
END $$;