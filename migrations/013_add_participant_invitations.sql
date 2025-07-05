-- Migration 013: Add Participant Invitations to Client Management
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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  
  -- Business logic should handle duplicate checking
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
-- PART 3: CREATE HELPER FUNCTIONS
-- =====================================================================

-- Function to create an invitation
CREATE OR REPLACE FUNCTION client_mgmt.create_invitation(
  p_invited_by BIGINT,
  p_email TEXT,
  p_client_id INTEGER,
  p_role TEXT DEFAULT 'member',
  p_message TEXT DEFAULT NULL,
  p_expires_days INTEGER DEFAULT 7
)
RETURNS UUID AS $$
DECLARE
  invitation_token UUID;
  expires_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate unique token
  invitation_token := gen_random_uuid();
  expires_timestamp := NOW() + (p_expires_days || ' days')::INTERVAL;
  
  -- Insert invitation
  INSERT INTO client_mgmt.participant_invitations (
    invited_by, email, client_id, invitation_token, 
    expires_at, invited_to_role, personal_message
  ) VALUES (
    p_invited_by, p_email, p_client_id, invitation_token::text,
    expires_timestamp, p_role, p_message
  );
  
  RETURN invitation_token;
END;
$$ LANGUAGE plpgsql;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION client_mgmt.accept_invitation(
  p_token TEXT,
  p_new_participant_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM client_mgmt.participant_invitations
  WHERE invitation_token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as accepted
  UPDATE client_mgmt.participant_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = invitation_record.id;
  
  -- You could add logic here to automatically add the participant to the client
  -- or create any necessary relationships
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION client_mgmt.expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  UPDATE client_mgmt.participant_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 4: GRANT PERMISSIONS
-- =====================================================================

-- Grant permissions on the table
GRANT ALL ON client_mgmt.participant_invitations TO PUBLIC;
GRANT ALL ON SEQUENCE client_mgmt.participant_invitations_id_seq TO PUBLIC;

-- =====================================================================
-- PART 5: UPDATE COMMENTS
-- =====================================================================

COMMENT ON TABLE client_mgmt.participant_invitations IS 'Participant invitation system for client onboarding';
COMMENT ON COLUMN client_mgmt.participant_invitations.invitation_token IS 'Unique token for invitation links';
COMMENT ON COLUMN client_mgmt.participant_invitations.status IS 'Invitation status: pending, accepted, expired, cancelled';

-- =====================================================================
-- PART 6: VERIFICATION
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

-- =====================================================================
-- POST-MIGRATION NOTES
-- =====================================================================

-- Usage examples:
-- 
-- Create invitation:
-- SELECT client_mgmt.create_invitation(
--   invited_by := 20,
--   email := 'new_user@example.com',
--   client_id := 1,
--   role := 'contributor',
--   message := 'Welcome to our team!'
-- );
--
-- Accept invitation:
-- SELECT client_mgmt.accept_invitation('token-uuid-here', new_participant_id);
--
-- Clean up expired invitations:
-- SELECT client_mgmt.expire_old_invitations();