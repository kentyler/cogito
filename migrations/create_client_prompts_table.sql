CREATE TABLE client_prompts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    prompt_text TEXT NOT NULL,
    label_text VARCHAR(100) NOT NULL,
    display_order FLOAT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying by client
CREATE INDEX idx_client_prompts_client_id ON client_prompts(client_id);

-- Index for ordering
CREATE INDEX idx_client_prompts_display_order ON client_prompts(client_id, display_order);

-- Add some example prompts for Cogito client (id=6)
INSERT INTO client_prompts (client_id, prompt_text, label_text, display_order) VALUES
(6, 'What interesting discussions about theology have been happening lately?', 'theology', 1.0),
(6, 'Show me recent conversations about software architecture and design patterns', 'architecture', 2.0),
(6, 'What philosophical questions have emerged from our recent conversations?', 'philosophy', 3.0),
(6, 'Summarize any insights about learning and knowledge formation', 'learning', 4.0),
(6, 'What patterns or themes are emerging across different conversation topics?', 'emergence', 5.0);