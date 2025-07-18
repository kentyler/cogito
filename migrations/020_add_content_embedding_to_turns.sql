-- Migration: Add content_embedding column to conversation.turns table
-- Uses OpenAI text-embedding-3-small model (1536 dimensions)

-- Add the embedding column
ALTER TABLE conversation.turns 
ADD COLUMN content_embedding vector(1536);

-- Create index for fast similarity searches
-- Start with fewer lists since we have ~1400 turns
CREATE INDEX IF NOT EXISTS idx_turns_content_embedding 
ON conversation.turns 
USING ivfflat (content_embedding vector_cosine_ops)
WITH (lists = 50);

-- Add comment for documentation
COMMENT ON COLUMN conversation.turns.content_embedding IS 'OpenAI text-embedding-3-small (1536-dim) embedding of turn content';