-- Create LLM types table
CREATE TABLE llm_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    api_handler VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_llm_types_client_id ON llm_types(client_id);

-- Create LLMs table
CREATE TABLE llms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    temperature DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 1000,
    type_id INTEGER REFERENCES llm_types(id),
    additional_config JSONB,
    subdomain VARCHAR(255) NOT NULL DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX idx_llms_client_id ON llms(client_id);

-- Create client_llms junction table
CREATE TABLE client_llms (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    llm_id BIGINT NOT NULL REFERENCES llms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT client_llms_client_id_llm_id_key UNIQUE (client_id, llm_id)
);

CREATE INDEX idx_client_llms_client_id ON client_llms(client_id);
CREATE INDEX idx_client_llms_llm_id ON client_llms(llm_id);

-- Create participant_llms junction table
CREATE TABLE participant_llms (
    id BIGSERIAL PRIMARY KEY,
    participant_id BIGINT NOT NULL REFERENCES participants(id),
    llm_id INTEGER NOT NULL REFERENCES llms(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id INTEGER NOT NULL DEFAULT 1 REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT participant_llms_participant_id_llm_id_key UNIQUE (participant_id, llm_id)
);

CREATE INDEX idx_participant_llms_client_id ON participant_llms(client_id);

-- Add current_llm_id to clients table (if not exists)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS current_llm_id INTEGER REFERENCES llms(id);

-- Add current_llm_id to participants table (if not exists)
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS current_llm_id INTEGER REFERENCES llms(id);

-- Insert default LLM types
INSERT INTO llm_types (name, description, api_handler, client_id) VALUES
('anthropic', 'Anthropic Claude models using the Messages API', 'handleAnthropicRequest', 6),
('openai', 'OpenAI models using the Chat Completions API', 'handleOpenAIRequest', 6),
('openai_assistant', 'OpenAI Custom GPTs and Assistants using the Assistants API', 'handleOpenAIAssistantRequest', 6);

-- Insert some default LLMs for Cogito (client_id = 6)
INSERT INTO llms (name, provider, model, api_key, type_id, client_id) VALUES
('Claude 3.5 Sonnet', 'anthropic', 'claude-3-5-sonnet-20241022', 'YOUR_ANTHROPIC_API_KEY', 
 (SELECT id FROM llm_types WHERE name = 'anthropic' AND client_id = 6), 6),
('GPT-4 Turbo', 'openai', 'gpt-4-turbo', 'YOUR_OPENAI_API_KEY', 
 (SELECT id FROM llm_types WHERE name = 'openai' AND client_id = 6), 6),
('GPT-4o', 'openai', 'gpt-4o', 'YOUR_OPENAI_API_KEY', 
 (SELECT id FROM llm_types WHERE name = 'openai' AND client_id = 6), 6);

-- Set a default LLM for Cogito client
UPDATE clients 
SET current_llm_id = (SELECT id FROM llms WHERE name = 'Claude 3.5 Sonnet' AND client_id = 6)
WHERE id = 6;