-- Migration 070: Add parent_client_id for mini-horde hierarchical architecture
-- Enables mini-hordes to inherit parent client data while maintaining isolation

-- Add parent_client_id column to client_mgmt.clients table
ALTER TABLE client_mgmt.clients 
ADD COLUMN parent_client_id INTEGER REFERENCES client_mgmt.clients(id);

-- Add index for efficient parent-child queries
CREATE INDEX idx_clients_parent_client_id ON client_mgmt.clients(parent_client_id);

-- Add comment to document the hierarchy
COMMENT ON COLUMN client_mgmt.clients.parent_client_id IS 'References parent client for mini-horde hierarchical data inheritance. Mini-hordes see parent + own data, parents see only own data.';

-- Example of how this will work:
-- Golden Horde (id: abc123, parent_client_id: NULL) - top-level client
-- Strategy Mini-Horde (id: def456, parent_client_id: abc123) - inherits Golden Horde data
-- Research Mini-Horde (id: ghi789, parent_client_id: abc123) - also inherits Golden Horde data