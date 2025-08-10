-- Add block_index field to conversation.turns for maintaining turn order within a block/meeting
-- This allows async processing while preserving the ability to reconstruct conversation order

ALTER TABLE conversation.turns 
ADD COLUMN block_index INTEGER;

-- Add index for efficient ordering queries
CREATE INDEX idx_conversation_turns_block_ordering 
ON conversation.turns(block_id, block_index) 
WHERE block_index IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN conversation.turns.block_index IS 'Sequential index of turn within a block/meeting, resets for each new block';