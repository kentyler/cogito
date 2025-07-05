-- Migration: Add meeting tables for Recall.ai bot integration
-- This extends the existing Cogito schema to support meeting bots

-- Add meeting-related columns to existing tables if they don't exist
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS recall_bot_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'live_meeting',
ADD COLUMN IF NOT EXISTS input_source TEXT DEFAULT 'recall_ai',
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb;

-- Add content_type to meeting_turns if it doesn't exist
ALTER TABLE meeting_turns
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'speech';

-- Create index for faster bot lookups
CREATE INDEX IF NOT EXISTS idx_meetings_recall_bot_id ON meetings(recall_bot_id);

-- Create meeting_insights table for pattern detection
CREATE TABLE IF NOT EXISTS meeting_insights (
  id BIGSERIAL PRIMARY KEY,
  meeting_id BIGINT REFERENCES meetings(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'decision', 'tension', 'breakthrough', 'pattern'
  content TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.5,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for meeting insights
CREATE INDEX IF NOT EXISTS idx_meeting_insights_meeting_id ON meeting_insights(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_insights_type ON meeting_insights(type);

-- Grant permissions
GRANT ALL ON meeting_insights TO authenticated;
GRANT ALL ON meeting_insights_id_seq TO authenticated;