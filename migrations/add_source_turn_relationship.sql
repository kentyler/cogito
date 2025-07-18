-- Add source turn relationship to support multiple responses
-- This allows multiple AI responses to reference the same user prompt

ALTER TABLE conversation.turns 
ADD COLUMN source_turn_id UUID REFERENCES conversation.turns(turn_id);

-- Add index for efficient lookups of response alternatives
CREATE INDEX idx_turns_source_turn_id ON conversation.turns(source_turn_id);

-- Add index for efficient lookups of source type + source turn combinations
CREATE INDEX idx_turns_source_type_source_turn ON conversation.turns(source_type, source_turn_id);

COMMENT ON COLUMN conversation.turns.source_turn_id IS 'References the turn that prompted this response. Multiple responses can share the same source_turn_id to represent conversation alternatives.';