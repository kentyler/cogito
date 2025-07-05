-- Create file_types table
CREATE TABLE file_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT file_types_name_key UNIQUE (name)
);

CREATE INDEX idx_file_types_client_id ON file_types(client_id);

-- Create file_uploads table
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    mime_type TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    public_url TEXT,
    bucket_name TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    tags TEXT[],
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_file_uploads_client_id ON file_uploads(client_id);

-- Create file_upload_vectors table
CREATE TABLE file_upload_vectors (
    id SERIAL PRIMARY KEY,
    file_upload_id INTEGER NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content_text TEXT NOT NULL,
    content_vector vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT file_upload_vectors_file_upload_id_chunk_index_key UNIQUE (file_upload_id, chunk_index)
);

-- Note: This assumes pgvector extension is already installed
-- If not, run: CREATE EXTENSION IF NOT EXISTS vector;