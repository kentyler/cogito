-- Conversation Pattern System Migration
-- Adds support for tracking conversation patterns and participant-specific patterns

-- 1. Conversations table - tracks ongoing conversation threads
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  subject VARCHAR(255), -- Email subject, meeting title, etc.
  context_type VARCHAR(50) NOT NULL, -- 'email_thread', 'zoom_meeting', 'slack_channel', etc.
  context_identifier VARCHAR(255), -- thread_id, meeting_id, channel_id
  project_id BIGINT REFERENCES projects(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'completed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Conversation Participants - tracks who's involved in each conversation
CREATE TABLE IF NOT EXISTS conversation_participants (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'organizer', 'contributor', 'observer', 'facilitator'
  participant_patterns JSONB DEFAULT '{}', -- Patterns specific to this participant in this conversation
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, participant_id)
);

-- 3. Conversation Interactions - individual messages/turns within conversations
CREATE TABLE IF NOT EXISTS conversation_interactions (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'email', 'chat_message', 'meeting_turn', 'system_note'
  content_text TEXT,
  content_metadata JSONB DEFAULT '{}', -- Email headers, message IDs, etc.
  patterns_observed JSONB DEFAULT '{}', -- Patterns detected in this specific interaction
  external_id VARCHAR(255), -- Gmail message ID, Zoom transcript ID, etc.
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Pattern Types - catalog of available patterns (like Christopher Alexander's pattern language)
CREATE TABLE IF NOT EXISTS pattern_types (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  description TEXT,
  scope_types TEXT[], -- ['email_thread', 'zoom_meeting'] - where this pattern applies
  detection_instructions TEXT NOT NULL, -- How to detect this pattern
  analysis_instructions TEXT, -- How to analyze this pattern when found
  application_instructions TEXT, -- How to apply this pattern when responding
  examples JSONB DEFAULT '[]', -- Array of example instances
  usefulness_score DECIMAL(3,2) DEFAULT 0.5, -- Track which patterns prove valuable (0-1)
  usage_count INTEGER DEFAULT 0, -- How often this pattern is detected
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Detected Patterns - instances where patterns were found
CREATE TABLE IF NOT EXISTS detected_patterns (
  id BIGSERIAL PRIMARY KEY,
  pattern_type_id BIGINT NOT NULL REFERENCES pattern_types(id),
  conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE,
  interaction_id BIGINT REFERENCES conversation_interactions(id) ON DELETE CASCADE,
  participant_id BIGINT REFERENCES participants(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) NOT NULL, -- 0-1, how confident we are this pattern exists
  pattern_data JSONB DEFAULT '{}', -- Specific data about this pattern instance
  reasoning TEXT, -- Why this pattern was detected
  context_scope VARCHAR(50) NOT NULL, -- 'participant', 'conversation', 'interaction'
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes for performance
CREATE INDEX idx_conversations_context ON conversations(context_type, context_identifier);
CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_part ON conversation_participants(participant_id);
CREATE INDEX idx_conversation_interactions_conv ON conversation_interactions(conversation_id);
CREATE INDEX idx_conversation_interactions_part ON conversation_interactions(participant_id);
CREATE INDEX idx_conversation_interactions_occurred ON conversation_interactions(occurred_at DESC);
CREATE INDEX idx_detected_patterns_pattern_type ON detected_patterns(pattern_type_id);
CREATE INDEX idx_detected_patterns_participant ON detected_patterns(participant_id);
CREATE INDEX idx_detected_patterns_conversation ON detected_patterns(conversation_id);

-- 7. Update timestamp triggers
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pattern_types_updated_at
  BEFORE UPDATE ON pattern_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Function to increment pattern usage
CREATE OR REPLACE FUNCTION increment_pattern_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pattern_types 
  SET usage_count = usage_count + 1 
  WHERE id = NEW.pattern_type_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_pattern_usage_trigger
  AFTER INSERT ON detected_patterns
  FOR EACH ROW
  EXECUTE FUNCTION increment_pattern_usage();

-- 9. View for easy querying of conversation context
CREATE OR REPLACE VIEW conversation_context AS
SELECT 
  c.id as conversation_id,
  c.subject,
  c.context_type,
  c.context_identifier,
  c.created_at as conversation_started,
  p.name as participant_name,
  cp.role as participant_role,
  cp.participant_patterns,
  cp.last_active,
  pr.name as project_name
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
JOIN participants p ON cp.participant_id = p.id
LEFT JOIN projects pr ON c.project_id = pr.id
WHERE cp.is_active = true
ORDER BY c.updated_at DESC, cp.last_active DESC;

-- 10. View for participant pattern summary
CREATE OR REPLACE VIEW participant_pattern_summary AS
SELECT 
  p.id as participant_id,
  p.name as participant_name,
  COUNT(DISTINCT c.id) as active_conversations,
  COUNT(DISTINCT dp.pattern_type_id) as unique_patterns_detected,
  AVG(dp.confidence_score) as avg_pattern_confidence,
  MAX(ci.occurred_at) as last_interaction,
  ARRAY_AGG(DISTINCT pt.name) as common_patterns
FROM participants p
LEFT JOIN conversation_participants cp ON p.id = cp.participant_id
LEFT JOIN conversations c ON cp.conversation_id = c.id AND c.status = 'active'
LEFT JOIN detected_patterns dp ON p.id = dp.participant_id
LEFT JOIN pattern_types pt ON dp.pattern_type_id = pt.id AND dp.confidence_score > 0.7
LEFT JOIN conversation_interactions ci ON p.id = ci.participant_id
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY last_interaction DESC NULLS LAST;

-- 11. Initial pattern types (starting with Ian's patterns)
INSERT INTO pattern_types (name, display_name, description, scope_types, detection_instructions, analysis_instructions, application_instructions, examples) VALUES
(
  'socratic_questioning',
  'Socratic Questioning', 
  'Challenges ideas through questions that promote deeper thinking rather than confrontation',
  ARRAY['email_thread', 'zoom_meeting'],
  'Look for: Questions about certainty ("How certain are you?"), references to prior statements, invitations to explore together, curious rather than confrontational tone.',
  'Identify: What assumption they are questioning, what evidence they reference, how they frame the exploration.',
  'When responding: Acknowledge intellectual humility, engage with their evidence, participate in the exploration they are offering. Avoid defensiveness.',
  '["I believe I saw a comment from you where... How certain of that are you? Let''s explore that together."]'
),
(
  'warm_intellectual_engagement',
  'Warm Intellectual Engagement',
  'Combines intellectual challenge with relationship building and respect',
  ARRAY['email_thread', 'zoom_meeting'],
  'Look for: Friendly greetings combined with intellectual challenges, acknowledgment of community/shared context, respectful disagreement.',
  'Identify: How they balance challenge with warmth, what relationship signals they include.',
  'When responding: Match their warmth while engaging seriously with their intellectual points. Acknowledge the relationship context.',
  '["Hello Cogito Claude! We in the conflict club community... I believe I saw a comment from you..."]'
),
(
  'evidence_based_reasoning',
  'Evidence-Based Reasoning',
  'References specific examples or prior statements when making points',
  ARRAY['email_thread', 'zoom_meeting', 'slack_channel'],
  'Look for: "I saw", "I believe", "I noticed", specific references to prior conversations, citations of examples.',
  'Identify: What evidence they cite, how they connect evidence to their point.',
  'When responding: Acknowledge their evidence, provide your own specific examples, build on their concrete observations.',
  '["I believe I saw a comment from you in which you were assuming..."]'
);

COMMENT ON TABLE conversations IS 'Tracks ongoing conversation threads across different mediums';
COMMENT ON TABLE conversation_participants IS 'Links participants to conversations with context-specific patterns';
COMMENT ON TABLE conversation_interactions IS 'Individual messages/turns within conversations';
COMMENT ON TABLE pattern_types IS 'Catalog of conversational patterns (like Christopher Alexander pattern language)';
COMMENT ON TABLE detected_patterns IS 'Instances where patterns were identified in conversations';