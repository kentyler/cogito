-- Add instructions column to client_prompts table
ALTER TABLE client_prompts 
ADD COLUMN instructions TEXT;

-- Update existing prompts with example instructions
UPDATE client_prompts SET instructions = 'Focus on theological concepts and their practical implications. Draw connections between different religious traditions when relevant.' WHERE label_text = 'theology';

UPDATE client_prompts SET instructions = 'Emphasize design patterns, architectural decisions, and code organization principles. Include specific examples from recent projects.' WHERE label_text = 'architecture';

UPDATE client_prompts SET instructions = 'Explore philosophical implications and underlying assumptions. Connect abstract concepts to concrete experiences.' WHERE label_text = 'philosophy';

UPDATE client_prompts SET instructions = 'Identify meta-learning patterns and knowledge construction processes. Highlight how understanding develops over time.' WHERE label_text = 'learning';

UPDATE client_prompts SET instructions = 'Look for cross-domain patterns and unexpected connections. Emphasize emergent properties and system-level insights.' WHERE label_text = 'emergence';