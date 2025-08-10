-- Create block_meeting_files junction table for linking files to meetings
-- This allows meeting bots to access uploaded files as context

CREATE TABLE IF NOT EXISTS conversation.block_meeting_files (
    id BIGSERIAL PRIMARY KEY,
    block_meeting_id UUID NOT NULL,
    file_upload_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_block_meeting_files_block_meeting 
        FOREIGN KEY (block_meeting_id) 
        REFERENCES conversation.block_meetings(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_block_meeting_files_file_upload 
        FOREIGN KEY (file_upload_id) 
        REFERENCES files.file_uploads(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_block_meeting_files_user 
        FOREIGN KEY (created_by_user_id) 
        REFERENCES client_mgmt.users(id) 
        ON DELETE CASCADE,
    
    -- Prevent duplicate file associations per meeting
    UNIQUE(block_meeting_id, file_upload_id)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_block_meeting_files_meeting_id 
    ON conversation.block_meeting_files(block_meeting_id);

CREATE INDEX IF NOT EXISTS idx_block_meeting_files_file_id 
    ON conversation.block_meeting_files(file_upload_id);

COMMENT ON TABLE conversation.block_meeting_files IS 
'Junction table linking uploaded files to meeting blocks for bot context';

COMMENT ON COLUMN conversation.block_meeting_files.block_meeting_id IS 
'Reference to the meeting block this file is associated with';

COMMENT ON COLUMN conversation.block_meeting_files.file_upload_id IS 
'Reference to the uploaded file that provides context for the meeting';

COMMENT ON COLUMN conversation.block_meeting_files.created_by_user_id IS 
'User who associated this file with the meeting';