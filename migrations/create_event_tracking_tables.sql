-- Create participant_event_categories table
CREATE TABLE participant_event_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT participant_event_categories_name_key UNIQUE (name)
);

CREATE INDEX idx_participant_event_categories_client_id ON participant_event_categories(client_id);

-- Create participant_event_types table
CREATE TABLE participant_event_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    participant_event_categories_id BIGINT REFERENCES participant_event_categories(id),
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_participant_event_types_client_id ON participant_event_types(client_id);

-- Create participant_events table
CREATE TABLE participant_events (
    id SERIAL PRIMARY KEY,
    participant_id BIGINT NOT NULL REFERENCES participants(id),
    event_type_id INTEGER NOT NULL REFERENCES participant_event_types(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_participant_events_client_id ON participant_events(client_id);
CREATE INDEX idx_participant_events_participant_id ON participant_events(participant_id);
CREATE INDEX idx_participant_events_event_type_id ON participant_events(event_type_id);

-- Create participant_event_logs table
CREATE TABLE participant_event_logs (
    id SERIAL PRIMARY KEY,
    schema_id INTEGER,
    participant_id INTEGER REFERENCES participants(id),
    event_type_id INTEGER REFERENCES participant_event_types(id),
    description TEXT,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_participant_event_logs_client_id ON participant_event_logs(client_id);
CREATE INDEX idx_participant_event_logs_participant_id ON participant_event_logs(participant_id);
CREATE INDEX idx_participant_event_logs_event_type_id ON participant_event_logs(event_type_id);

-- Insert some default event categories for Cogito (client_id = 6)
INSERT INTO participant_event_categories (name, description, client_id) VALUES
('conversation', 'Events related to conversation interactions', 6),
('system', 'System-level events and operations', 6),
('user_action', 'User-initiated actions and behaviors', 6),
('ai_response', 'AI-generated responses and interactions', 6),
('file_operation', 'File upload, processing, and management events', 6),
('search', 'Search and query operations', 6);

-- Insert some default event types for Cogito
INSERT INTO participant_event_types (name, description, participant_event_categories_id, client_id) VALUES
-- Conversation events
('prompt_submitted', 'User submitted a prompt', (SELECT id FROM participant_event_categories WHERE name = 'conversation' AND client_id = 6), 6),
('response_generated', 'AI generated a response', (SELECT id FROM participant_event_categories WHERE name = 'conversation' AND client_id = 6), 6),
('session_started', 'Conversation session started', (SELECT id FROM participant_event_categories WHERE name = 'conversation' AND client_id = 6), 6),
('session_ended', 'Conversation session ended', (SELECT id FROM participant_event_categories WHERE name = 'conversation' AND client_id = 6), 6),

-- File operation events
('file_uploaded', 'File was uploaded to the system', (SELECT id FROM participant_event_categories WHERE name = 'file_operation' AND client_id = 6), 6),
('file_processed', 'File content was processed and vectorized', (SELECT id FROM participant_event_categories WHERE name = 'file_operation' AND client_id = 6), 6),
('file_deleted', 'File was deleted from the system', (SELECT id FROM participant_event_categories WHERE name = 'file_operation' AND client_id = 6), 6),

-- Search events
('semantic_search', 'Semantic search was performed', (SELECT id FROM participant_event_categories WHERE name = 'search' AND client_id = 6), 6),
('file_search', 'File content search was performed', (SELECT id FROM participant_event_categories WHERE name = 'search' AND client_id = 6), 6),

-- User action events
('button_clicked', 'User clicked a prompt button', (SELECT id FROM participant_event_categories WHERE name = 'user_action' AND client_id = 6), 6),
('context_switched', 'User switched conversation context', (SELECT id FROM participant_event_categories WHERE name = 'user_action' AND client_id = 6), 6),

-- System events
('error_occurred', 'System error occurred', (SELECT id FROM participant_event_categories WHERE name = 'system' AND client_id = 6), 6),
('service_started', 'Service or component started', (SELECT id FROM participant_event_categories WHERE name = 'system' AND client_id = 6), 6),
('maintenance_performed', 'System maintenance was performed', (SELECT id FROM participant_event_categories WHERE name = 'system' AND client_id = 6), 6);