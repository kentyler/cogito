-- Migration: Create turn_embeddings table
-- This will replace both meetings.turns.content_embedding and context.chunks.embedding_vector
-- All embeddings (from existing turns and file chunks) will go here

BEGIN;

-- Create turn_embeddings table in meetings schema (since it's turn-related)
CREATE TABLE meetings.turn_embeddings (
  id BIGSERIAL PRIMARY KEY,
  
  -- Turn reference
  turn_id UUID NOT NULL,              -- References meetings.turns.id
  
  -- Content and embedding
  content_text TEXT NOT NULL,         -- The actual text that was embedded
  embedding_vector vector(1536),      -- OpenAI embedding (1536 dimensions)
  
  -- Chunk information for long content
  chunk_index INTEGER NOT NULL DEFAULT 0,  -- 0 = whole turn content, 1+ = chunk number
  chunk_size INTEGER,                 -- Size of this chunk in characters
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Source info, filename, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to turns
  FOREIGN KEY (turn_id) REFERENCES meetings.turns(id) ON DELETE CASCADE,
  
  -- Unique constraint: one embedding per turn per chunk_index
  UNIQUE (turn_id, chunk_index)
);

-- Indexes for performance
CREATE INDEX idx_turn_embeddings_turn_id ON meetings.turn_embeddings(turn_id);
CREATE INDEX idx_turn_embeddings_created_at ON meetings.turn_embeddings(created_at DESC);

-- Vector similarity search index
CREATE INDEX idx_turn_embeddings_vector ON meetings.turn_embeddings 
USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);

-- Comments
COMMENT ON TABLE meetings.turn_embeddings IS 'All embeddings for turn content, replacing both turns.content_embedding and context.chunks';
COMMENT ON COLUMN meetings.turn_embeddings.turn_id IS 'References the turn this embedding belongs to';
COMMENT ON COLUMN meetings.turn_embeddings.content_text IS 'The actual text content that was embedded (may be chunk of larger content)';
COMMENT ON COLUMN meetings.turn_embeddings.chunk_index IS '0 for whole turn content, 1+ for chunks of long content';

-- Helper function to search similar content across all turns
CREATE OR REPLACE FUNCTION meetings.search_similar_turn_content(
  p_query_embedding vector(1536),
  p_client_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  turn_id UUID,
  content_text TEXT,
  similarity FLOAT,
  chunk_index INTEGER,
  turn_content TEXT,
  turn_source_type VARCHAR,
  turn_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    te.turn_id,
    te.content_text,
    (1 - (te.embedding_vector <=> p_query_embedding)) as similarity,
    te.chunk_index,
    t.content as turn_content,
    t.source_type as turn_source_type,
    t.timestamp as turn_timestamp
  FROM meetings.turn_embeddings te
  JOIN meetings.turns t ON te.turn_id = t.id
  WHERE (p_client_id IS NULL OR t.client_id = p_client_id)
    AND (1 - (te.embedding_vector <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY te.embedding_vector <=> p_query_embedding ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create migration tracking record (use correct meetings table structure)
INSERT INTO meetings.meetings (
    id, 
    name, 
    description, 
    meeting_type, 
    created_at, 
    updated_at,
    metadata
) VALUES (
    gen_random_uuid(),
    'Schema Migration: Create turn_embeddings table',
    'Creates turn_embeddings table to unify all embedding storage',
    'system',
    NOW(),
    NOW(),
    '{"migration": "create_turn_embeddings_table", "step": "1_create_table"}'::jsonb
);

COMMIT;