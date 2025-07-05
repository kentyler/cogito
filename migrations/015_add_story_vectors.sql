-- Migration: Add story vectors and reorganize content vectors
-- Adds explicit vector columns for content and story embeddings
-- Moves content_vector from metadata JSONB to dedicated column

BEGIN;

-- Add new vector columns to turns table
ALTER TABLE conversation.turns 
ADD COLUMN content_vector vector(384),  -- all-MiniLM-L6-v2 embedding size
ADD COLUMN story_vector vector(384),    -- story narrative embedding
ADD COLUMN story_text text;            -- human-readable story description

-- Create indexes for vector similarity search
CREATE INDEX idx_turns_content_vector ON conversation.turns USING ivfflat (content_vector vector_cosine_ops);
CREATE INDEX idx_turns_story_vector ON conversation.turns USING ivfflat (story_vector vector_cosine_ops);

-- Add comment explaining the story fields
COMMENT ON COLUMN conversation.turns.story_vector IS 'Embedding of [group_story_snapshot, individual_story_expression, story_dynamics_shift]';
COMMENT ON COLUMN conversation.turns.story_text IS 'Human-readable description of conversational story state for this turn';
COMMENT ON COLUMN conversation.turns.content_vector IS 'Embedding of the actual turn content text';

-- Migration note: Existing content_vector data in metadata JSONB can be migrated separately
-- This establishes the new schema structure for going forward

COMMIT;