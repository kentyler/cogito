-- Create invitations table for managing client invitations
-- Run with: psql -d cogito_development -f migrations/create_invitations_table.sql

CREATE TABLE IF NOT EXISTS client_mgmt.invitations (
    id SERIAL PRIMARY KEY,

    -- Invitation details
    token VARCHAR(64) UNIQUE NOT NULL,  -- Secure random token for invitation link
    email VARCHAR(255) NOT NULL,       -- Email address of invitee
    recipient_name VARCHAR(255),       -- Optional name of person being invited
    personal_message TEXT,             -- Optional personal message from inviter

    -- Client and role information
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',  -- Role to assign when accepted

    -- Invitation metadata
    invited_by INTEGER NOT NULL REFERENCES client_mgmt.users(id) ON DELETE CASCADE,  -- User who sent invitation
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by INTEGER REFERENCES client_mgmt.users(id),  -- User record created when accepted

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_invitations_token ON client_mgmt.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON client_mgmt.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_client_id ON client_mgmt.invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON client_mgmt.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON client_mgmt.invitations(expires_at);

-- Comments for documentation
COMMENT ON TABLE client_mgmt.invitations IS 'Client invitation management - tracks pending and completed invitations';
COMMENT ON COLUMN client_mgmt.invitations.token IS 'Secure random token used in invitation URLs';
COMMENT ON COLUMN client_mgmt.invitations.role IS 'Role to assign to user when invitation is accepted';
COMMENT ON COLUMN client_mgmt.invitations.status IS 'Current status: pending, accepted, expired, or revoked';
COMMENT ON COLUMN client_mgmt.invitations.accepted_by IS 'User ID created when invitation was accepted';

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE client_mgmt.invitations
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invitations_updated_at
    BEFORE UPDATE ON client_mgmt.invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_invitations_updated_at();

COMMENT ON FUNCTION expire_old_invitations() IS 'Utility function to mark expired invitations - can be called periodically';