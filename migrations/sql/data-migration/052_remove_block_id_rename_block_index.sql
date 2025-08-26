-- Migration: Remove block_id from turns table and rename block_index to meeting_index
-- This completes the transition from blocks to meetings as the primary organizing concept

BEGIN;

-- Drop the foreign key constraint on block_id
ALTER TABLE conversation.turns 
  DROP CONSTRAINT IF EXISTS turns_block_id_fkey;

-- Drop indexes related to block_id and block_index
DROP INDEX IF EXISTS conversation.idx_turns_block_id;
DROP INDEX IF EXISTS conversation.idx_conversation_turns_block_ordering;

-- Remove block_id column
ALTER TABLE conversation.turns 
  DROP COLUMN IF EXISTS block_id;

-- Rename block_index to meeting_index
ALTER TABLE conversation.turns 
  RENAME COLUMN block_index TO meeting_index;

-- Create new index for meeting_id and meeting_index ordering
CREATE INDEX IF NOT EXISTS idx_conversation_turns_meeting_ordering 
  ON conversation.turns(meeting_id, meeting_index) 
  WHERE meeting_index IS NOT NULL;

-- Add comment to clarify the column's purpose
COMMENT ON COLUMN conversation.turns.meeting_index IS 'Order of turn within a meeting (if applicable)';

COMMIT;