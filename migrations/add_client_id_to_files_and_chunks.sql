-- Add client_id to context.files table
ALTER TABLE context.files 
ADD COLUMN client_id INTEGER;

-- Add client_id to context.chunks table  
ALTER TABLE context.chunks
ADD COLUMN client_id INTEGER;

-- Add foreign key constraints
ALTER TABLE context.files
ADD CONSTRAINT fk_files_client_id 
FOREIGN KEY (client_id) 
REFERENCES client_mgmt.clients(id);

ALTER TABLE context.chunks
ADD CONSTRAINT fk_chunks_client_id
FOREIGN KEY (client_id)
REFERENCES client_mgmt.clients(id);

-- Create indexes for better query performance
CREATE INDEX idx_files_client_id ON context.files(client_id);
CREATE INDEX idx_chunks_client_id ON context.chunks(client_id);

-- Update existing records to have client_id from metadata if available
UPDATE context.files 
SET client_id = (metadata->>'client_id')::INTEGER
WHERE metadata->>'client_id' IS NOT NULL;

-- For chunks, get client_id from their parent file
UPDATE context.chunks c
SET client_id = f.client_id
FROM context.files f
WHERE c.file_id = f.id 
AND f.client_id IS NOT NULL;