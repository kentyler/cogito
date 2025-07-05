-- Migration: Add block_attendees table for meeting participants
-- Simple approach: track attendees by name with optional user upsell

CREATE TABLE conversation.block_attendees (
  id BIGSERIAL PRIMARY KEY,
  block_id uuid REFERENCES conversation.blocks(block_id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Name as provided by Recall.ai
  user_id BIGINT REFERENCES client_mgmt.users(id), -- NULL until they create account
  story TEXT, -- Their evolving narrative
  story_embedding vector(1536), -- For semantic search
  speaking_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_block_attendees_block_id ON conversation.block_attendees(block_id);
CREATE INDEX idx_block_attendees_name ON conversation.block_attendees(name);
CREATE INDEX idx_block_attendees_user_id ON conversation.block_attendees(user_id);
CREATE INDEX idx_block_attendees_story_embedding ON conversation.block_attendees 
USING ivfflat (story_embedding vector_cosine_ops) WITH (lists = 100);

-- Unique constraint: one record per attendee per block
CREATE UNIQUE INDEX idx_block_attendees_unique ON conversation.block_attendees(block_id, name);

-- Grant permissions
GRANT ALL ON conversation.block_attendees TO authenticated;
GRANT ALL ON conversation.block_attendees_id_seq TO authenticated;