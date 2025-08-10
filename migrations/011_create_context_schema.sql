-- Migration: Create context schema for unified file and snippet storage
-- This migration creates the context schema with files and chunks tables
-- for storing both uploaded files and hotkey snippets with their embeddings

BEGIN;

-- Create the context schema
CREATE SCHEMA IF NOT EXISTS context;

-- Create files table for both uploads and snippets
CREATE TABLE context.files (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(255),
  content_data BYTEA NOT NULL,          -- File contents stored in PostgreSQL
  content_type VARCHAR(100) NOT NULL,   -- MIME type (e.g., 'text/plain', 'application/pdf')
  file_size BIGINT NOT NULL,            -- Size in bytes
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('upload', 'snippet')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb   -- Additional metadata (tags, descriptions, etc.)
);

-- Create chunks table for text content and embeddings
CREATE TABLE context.chunks (
  id BIGSERIAL PRIMARY KEY,
  file_id BIGINT NOT NULL,
  content TEXT NOT NULL,                -- The actual text chunk
  embedding_vector vector(1536),        -- OpenAI embedding vector (1536 dimensions)
  chunk_index INTEGER NOT NULL,         -- Order within the file (0-based)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,   -- Chunk-specific metadata
  
  -- Foreign key to files table
  FOREIGN KEY (file_id) REFERENCES context.files(id) ON DELETE CASCADE,
  
  -- Ensure chunk ordering is unique per file
  UNIQUE (file_id, chunk_index)
);

-- Create junction table linking meetings to context files
-- Note: meetings.meeting_files already exists for file_uploads, so we create a new table for context files
CREATE TABLE meetings.meeting_context_files (
  meeting_id UUID NOT NULL,
  context_file_id BIGINT NOT NULL,
  relationship_type VARCHAR(50) DEFAULT 'context',  -- 'context', 'attachment', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id BIGINT,
  
  -- Foreign keys
  FOREIGN KEY (meeting_id) REFERENCES meetings.meetings(meeting_id) ON DELETE CASCADE,
  FOREIGN KEY (context_file_id) REFERENCES context.files(id) ON DELETE CASCADE,
  
  -- Primary key on the relationship
  PRIMARY KEY (meeting_id, context_file_id)
);

-- Indexes for performance
CREATE INDEX idx_context_files_source_type ON context.files(source_type);
CREATE INDEX idx_context_files_content_type ON context.files(content_type);
CREATE INDEX idx_context_files_created_at ON context.files(created_at DESC);

CREATE INDEX idx_context_chunks_file_id ON context.chunks(file_id);
CREATE INDEX idx_context_chunks_created_at ON context.chunks(created_at DESC);

-- Index for vector similarity search (if using pgvector)
CREATE INDEX idx_context_chunks_embedding ON context.chunks USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_meeting_context_files_meeting_id ON meetings.meeting_context_files(meeting_id);
CREATE INDEX idx_meeting_context_files_context_file_id ON meetings.meeting_context_files(context_file_id);
CREATE INDEX idx_meeting_context_files_created_at ON meetings.meeting_context_files(created_at DESC);

-- Update database search path to include context schema
-- Note: This will be handled by updating the database config

-- Create a migration tracking record
INSERT INTO meetings.meetings (
    meeting_id, 
    name, 
    description, 
    meeting_type, 
    created_at, 
    updated_at,
    metadata
) VALUES (
    gen_random_uuid(),
    'Schema Migration: Create context schema',
    'Migration tracking record for creating context schema with files and chunks tables',
    'system',
    NOW(),
    NOW(),
    '{"migration": "011_create_context_schema", "action": "create_context_schema_with_files_chunks"}'::jsonb
);

COMMIT;

-- Verification queries
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'context' 
ORDER BY tablename;

-- Check foreign key constraints
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'context' AND tc.constraint_type = 'FOREIGN KEY';