-- Add created_by_user_id to blocks table
-- This tracks who created any block (meetings, conversations, etc.)

-- Add the column if it doesn't exist
ALTER TABLE conversation.blocks 
ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;

-- Add foreign key constraint to users table
ALTER TABLE conversation.blocks 
DROP CONSTRAINT IF EXISTS fk_blocks_created_by_user;

ALTER TABLE conversation.blocks 
ADD CONSTRAINT fk_blocks_created_by_user 
FOREIGN KEY (created_by_user_id) 
REFERENCES client_mgmt.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_blocks_created_by_user 
ON conversation.blocks(created_by_user_id);

-- Comment on the column
COMMENT ON COLUMN conversation.blocks.created_by_user_id IS 'User who created this block (from client_mgmt.users)';

-- For existing meeting blocks, set created_by_user_id from block_meetings.invited_by_user_id
UPDATE conversation.blocks b
SET created_by_user_id = bm.invited_by_user_id
FROM conversation.block_meetings bm
WHERE b.block_id = bm.block_id
  AND b.created_by_user_id IS NULL
  AND bm.invited_by_user_id IS NOT NULL;