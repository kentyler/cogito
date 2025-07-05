-- Migration 013: Add Participant Invitations to Client Management (Simple)
-- Date: 2025-06-29
-- Purpose: Add invitation system to client_mgmt schema

BEGIN;

-- =====================================================================
-- PART 1: CREATE PARTICIPANT INVITATIONS TABLE
-- =====================================================================

CREATE TABLE client_mgmt.participant_invitations (
  id BIGSERIAL PRIMARY KEY,
  invited_by BIGINT REFERENCES conversation.participants(id),
  email TEXT NOT NULL,
  client_id INTEGER REFERENCES client_mgmt.clients(id) NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional useful fields
  invited_to_role TEXT DEFAULT 'member',
  personal_message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- =====================================================================
-- PART 2: CREATE INDEXES
-- =====================================================================

CREATE INDEX idx_participant_invitations_client ON client_mgmt.participant_invitations(client_id);
CREATE INDEX idx_participant_invitations_email ON client_mgmt.participant_invitations(email);
CREATE INDEX idx_participant_invitations_token ON client_mgmt.participant_invitations(invitation_token);
CREATE INDEX idx_participant_invitations_status ON client_mgmt.participant_invitations(status);
CREATE INDEX idx_participant_invitations_expires ON client_mgmt.participant_invitations(expires_at);

-- =====================================================================
-- PART 3: GRANT PERMISSIONS
-- =====================================================================

-- Grant permissions on the table
GRANT ALL ON client_mgmt.participant_invitations TO PUBLIC;
GRANT ALL ON SEQUENCE client_mgmt.participant_invitations_id_seq TO PUBLIC;

-- =====================================================================
-- PART 4: UPDATE COMMENTS
-- =====================================================================

COMMENT ON TABLE client_mgmt.participant_invitations IS 'Participant invitation system for client onboarding';
COMMENT ON COLUMN client_mgmt.participant_invitations.invitation_token IS 'Unique token for invitation links';
COMMENT ON COLUMN client_mgmt.participant_invitations.status IS 'Invitation status: pending, accepted, expired, cancelled';

-- =====================================================================
-- PART 5: VERIFICATION
-- =====================================================================

DO $$
DECLARE
  client_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'client_mgmt';
  
  RAISE NOTICE 'Participant invitations added to client_mgmt schema';
  RAISE NOTICE '  client_mgmt schema now has % tables', client_tables;
END $$;

COMMIT;