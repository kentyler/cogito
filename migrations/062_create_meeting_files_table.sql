-- Migration: Create meeting_files table
-- This replaces the removed block_meeting_files table with a direct relationship
-- between meetings and files, removing the intermediate block concept.
-- The table links files directly to meetings without block_meeting_id.

BEGIN;

-- Create meeting_files table with direct meeting relationship
CREATE TABLE conversation.meeting_files (
    id SERIAL PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES conversation.meetings(meeting_id) ON DELETE CASCADE,
    file_upload_id INTEGER NOT NULL REFERENCES files.file_uploads(id) ON DELETE CASCADE,
    created_by_user_id BIGINT REFERENCES client_mgmt.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_meeting_files_meeting_id ON conversation.meeting_files(meeting_id);
CREATE INDEX idx_meeting_files_file_upload_id ON conversation.meeting_files(file_upload_id);
CREATE INDEX idx_meeting_files_created_by_user_id ON conversation.meeting_files(created_by_user_id);

-- Prevent duplicate file-meeting associations
CREATE UNIQUE INDEX idx_meeting_files_unique_meeting_file 
ON conversation.meeting_files(meeting_id, file_upload_id);

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'meeting_files table created successfully.';
    RAISE NOTICE 'Table links files directly to meetings without intermediate block relationships.';
END $$;

COMMIT;