-- Add invitation fields to users table
-- Allows users to be created without passwords and invited via email

ALTER TABLE client_mgmt.users
ADD COLUMN invitation_token UUID DEFAULT NULL,
ADD COLUMN invitation_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN invited_by_user_id BIGINT REFERENCES client_mgmt.users(id),
ADD COLUMN invited_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index for fast token lookups
CREATE INDEX idx_users_invitation_token ON client_mgmt.users(invitation_token) 
WHERE invitation_token IS NOT NULL;

-- Index for finding pending invitations
CREATE INDEX idx_users_pending_invitations ON client_mgmt.users(email) 
WHERE password_hash IS NULL AND invitation_token IS NOT NULL;

-- Comments
COMMENT ON COLUMN client_mgmt.users.invitation_token IS 'Token for invited users to set their password';
COMMENT ON COLUMN client_mgmt.users.invitation_expires IS 'When the invitation token expires';
COMMENT ON COLUMN client_mgmt.users.invited_by_user_id IS 'User who sent the invitation';
COMMENT ON COLUMN client_mgmt.users.invited_at IS 'When the invitation was sent';