-- Add story fields to client_mgmt.clients table
-- This allows each client to have a living story that gets updated as events occur

ALTER TABLE client_mgmt.clients 
ADD COLUMN story TEXT DEFAULT '',
ADD COLUMN story_embedding vector(1536);

-- Add index for vector similarity search on story embeddings
CREATE INDEX idx_clients_story_embedding ON client_mgmt.clients USING ivfflat (story_embedding vector_cosine_ops);

-- Add comment explaining the story field
COMMENT ON COLUMN client_mgmt.clients.story IS 'Living narrative of client activities, updated as events occur';
COMMENT ON COLUMN client_mgmt.clients.story_embedding IS 'Embedding of the story text for similarity search and analysis';

-- Update existing clients to have empty story initially
UPDATE client_mgmt.clients SET story = 'This client story will be updated as activities and events occur.';