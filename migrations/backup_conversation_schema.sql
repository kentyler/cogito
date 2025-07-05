-- BACKUP: Current conversation-related table schemas before blocks migration
-- Created: 2025-06-28
-- Purpose: Preserve ability to recreate current conversation tables if rollback needed

-- =====================================================================
-- CONVERSATION_TURNS TABLE (inferred from usage in database.js)
-- =====================================================================
CREATE TABLE IF NOT EXISTS conversation_turns_backup_schema (
  id BIGSERIAL PRIMARY KEY,
  participant_id BIGINT REFERENCES participants(id),
  project_id BIGINT REFERENCES projects(id),
  turn_index INTEGER,
  content_text TEXT,
  interaction_type VARCHAR(50), -- 'human_input', 'ai_response', etc.
  session_id TEXT,
  processing_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- CONVERSATION TABLES FROM add_conversation_patterns.sql
-- =====================================================================

-- 1. Conversations table - tracks ongoing conversation threads
CREATE TABLE IF NOT EXISTS conversations_backup_schema (
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
CREATE TABLE IF NOT EXISTS conversation_participants_backup_schema (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations_backup_schema(id) ON DELETE CASCADE,
  participant_id BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'organizer', 'contributor', 'observer', 'facilitator'
  participant_patterns JSONB DEFAULT '{}', -- Patterns specific to this participant in this conversation
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, participant_id)
);

-- 3. Conversation Interactions - individual messages/turns within conversations
CREATE TABLE IF NOT EXISTS conversation_interactions_backup_schema (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations_backup_schema(id) ON DELETE CASCADE,
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

-- 4. Conversation Context View (from add_conversation_patterns.sql)
-- Note: This was a VIEW, not a table
-- CREATE OR REPLACE VIEW conversation_context AS
-- SELECT 
--   c.id as conversation_id,
--   c.subject,
--   c.context_type,
--   c.context_identifier,
--   c.created_at as conversation_started,
--   p.name as participant_name,
--   cp.role as participant_role,
--   cp.participant_patterns,
--   cp.last_active,
--   pr.name as project_name
-- FROM conversations c
-- JOIN conversation_participants cp ON c.id = cp.conversation_id
-- JOIN participants p ON cp.participant_id = p.id
-- LEFT JOIN projects pr ON c.project_id = pr.id
-- WHERE cp.is_active = true
-- ORDER BY c.updated_at DESC, cp.last_active DESC;

-- =====================================================================
-- INDEXES (from add_conversation_patterns.sql)
-- =====================================================================
-- Note: These would be on the actual tables, not backup schemas

-- CREATE INDEX idx_conversations_context ON conversations(context_type, context_identifier);
-- CREATE INDEX idx_conversations_project ON conversations(project_id);
-- CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
-- CREATE INDEX idx_conversation_participants_participant ON conversation_participants(participant_id);
-- CREATE INDEX idx_conversation_interactions_conversation ON conversation_interactions(conversation_id);
-- CREATE INDEX idx_conversation_interactions_participant ON conversation_interactions(participant_id);
-- CREATE INDEX idx_conversation_interactions_type ON conversation_interactions(interaction_type);
-- CREATE INDEX idx_conversation_interactions_occurred ON conversation_interactions(occurred_at);

-- =====================================================================
-- RESTORE INSTRUCTIONS
-- =====================================================================
-- To restore these tables if rollback is needed:
-- 1. Drop the backup_schema suffix from table names
-- 2. Add the indexes listed above
-- 3. Recreate the conversation_context view
-- 4. Update application code to use conversation tables instead of blocks