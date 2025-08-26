-- Add client_id column to context.files and context.chunks tables

-- Add client_id to context.files
ALTER TABLE context.files 
ADD COLUMN client_id BIGINT;

-- Add foreign key constraint to reference client_mgmt.clients
ALTER TABLE context.files
ADD CONSTRAINT fk_files_client_id 
FOREIGN KEY (client_id) 
REFERENCES client_mgmt.clients(id)
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_context_files_client_id ON context.files(client_id);

-- Add client_id to context.chunks
ALTER TABLE context.chunks 
ADD COLUMN client_id BIGINT;

-- Add foreign key constraint to reference client_mgmt.clients
ALTER TABLE context.chunks
ADD CONSTRAINT fk_chunks_client_id 
FOREIGN KEY (client_id) 
REFERENCES client_mgmt.clients(id)
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_context_chunks_client_id ON context.chunks(client_id);

-- Add compound index for file_id and client_id on chunks for better join performance
CREATE INDEX idx_context_chunks_file_client ON context.chunks(file_id, client_id);