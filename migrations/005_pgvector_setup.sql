-- Install pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_locations_embedding ON locations 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);