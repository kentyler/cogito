-- Create user_alias table for mapping speaker names to user_ids across different contexts
-- This enables the SpeakerProfileAgent to identify speakers across platforms (Google Meet, Zoom, etc.)

CREATE TABLE client_mgmt.user_alias (
  alias_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES client_mgmt.users(id) ON DELETE CASCADE,
  context VARCHAR(50) NOT NULL,  -- e.g., 'google_meet', 'zoom', 'teams', 'recall_ai'
  alias VARCHAR(200) NOT NULL,   -- e.g., 'Kenneth Tyler', 'Ken T.', 'k.tyler@company.com'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user_id BIGINT REFERENCES client_mgmt.users(id),
  metadata JSONB,  -- For additional context like email domain, confidence scores, etc.
  
  -- Ensure unique alias per context
  CONSTRAINT unique_context_alias UNIQUE (context, alias)
);

-- Index for efficient lookups during speaker identification
CREATE INDEX idx_user_alias_context_alias ON client_mgmt.user_alias(context, alias);

-- Index for finding all aliases for a user
CREATE INDEX idx_user_alias_user_id ON client_mgmt.user_alias(user_id);

-- Comments
COMMENT ON TABLE client_mgmt.user_alias IS 'Maps speaker names/identifiers to user_ids across different meeting platforms and contexts';
COMMENT ON COLUMN client_mgmt.user_alias.context IS 'Meeting platform hostname (meet.google.com, zoom.us, teams.microsoft.com, etc.)';
COMMENT ON COLUMN client_mgmt.user_alias.alias IS 'Speaker name or identifier as it appears in that context';
COMMENT ON COLUMN client_mgmt.user_alias.metadata IS 'Additional context like confidence scores, email domains, or matching rules used';

-- Insert some example mappings for testing
-- (These would normally be created by the SpeakerProfileAgent or through user interaction)
INSERT INTO client_mgmt.user_alias (user_id, context, alias, metadata) VALUES
  (1, 'meet.google.com', 'Kenneth Tyler', '{"source": "manual_mapping", "confidence": 1.0}'),
  (1, 'zoom.us', 'Kenneth Tyler', '{"source": "manual_mapping", "confidence": 1.0}'),
  (1, 'teams.microsoft.com', 'Kenneth Tyler', '{"source": "manual_mapping", "confidence": 1.0}');

-- Note: Additional user mappings would be added as speakers are identified
-- The SpeakerProfileAgent will query this table to resolve speaker names to user_ids