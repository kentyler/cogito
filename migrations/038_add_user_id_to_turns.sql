-- Add user_id field to conversation.turns table for speaker identification
-- This aligns with the system's drift towards using user_id instead of participant_id

ALTER TABLE conversation.turns 
ADD COLUMN user_id BIGINT;

-- Add foreign key constraint to users table (in client_mgmt schema)
ALTER TABLE conversation.turns 
ADD CONSTRAINT fk_turns_user_id 
FOREIGN KEY (user_id) REFERENCES client_mgmt.users(id);

-- Create index for efficient querying of user's turns
CREATE INDEX idx_conversation_turns_user_id 
ON conversation.turns(user_id, timestamp DESC);

-- Add comment explaining the field
COMMENT ON COLUMN conversation.turns.user_id IS 'References users.user_id - used for identifying speaker across conversations for profile generation';

-- Note: participant_id field remains for backward compatibility
-- Future work may involve migrating data or deprecating participant_id