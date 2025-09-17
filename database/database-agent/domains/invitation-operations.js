/**
 * Invitation Operations - Database operations for client invitations
 * Handles invitation creation, acceptance, and management
 */

import crypto from 'crypto';

export class InvitationOperations {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Create a new invitation to join a client
   * @param {Object} invitationData - Invitation details
   * @param {string} invitationData.email - Email address of invitee
   * @param {number} invitationData.clientId - Client ID to invite to
   * @param {number} invitationData.invitedBy - User ID of person sending invitation
   * @param {string} invitationData.role - Role to assign (default: 'member')
   * @param {string} invitationData.recipientName - Optional name of invitee
   * @param {string} invitationData.personalMessage - Optional personal message
   * @returns {Promise<Object>} Created invitation record
   */
  async createInvitation(invitationData) {
    const {
      email,
      clientId,
      invitedBy,
      role = 'member',
      recipientName = null,
      personalMessage = null
    } = invitationData;

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // TESTING EXCEPTION: Allow invitations to existing users for ken@8thfold.com
    const isTestingEmail = email.toLowerCase() === 'ken@8thfold.com';
    if (!isTestingEmail) {
      // Normal check: prevent invitations to existing users with passwords
      const existingUserQuery = `
        SELECT id FROM client_mgmt.users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND password_hash IS NOT NULL
      `;
      const existingUserResult = await this.connector.query(existingUserQuery, [email]);

      if (existingUserResult.rows.length > 0) {
        throw new Error('User already exists and has access');
      }
    }

    // Check if there's already a pending invitation for this email + client
    const existingQuery = `
      SELECT id, status, expires_at
      FROM client_mgmt.invitations
      WHERE email = $1 AND client_id = $2 AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const existingResult = await this.connector.query(existingQuery, [email, clientId]);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (new Date(existing.expires_at) > new Date()) {
        throw new Error('A pending invitation already exists for this email address');
      }
      // Expire the old invitation
      await this.connector.query(
        'UPDATE client_mgmt.invitations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['expired', existing.id]
      );
    }

    const query = `
      INSERT INTO client_mgmt.invitations (
        token, email, recipient_name, personal_message,
        client_id, role, invited_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.connector.query(query, [
      token, email, recipientName, personalMessage,
      clientId, role, invitedBy
    ]);

    return result.rows[0];
  }

  /**
   * Get invitation by token
   * @param {string} token - Invitation token
   * @returns {Promise<Object|null>} Invitation record with client and inviter details
   */
  async getInvitationByToken(token) {
    const query = `
      SELECT
        i.*,
        c.name as client_name,
        u.email as inviter_email,
        u.metadata as inviter_metadata
      FROM client_mgmt.invitations i
      JOIN client_mgmt.clients c ON i.client_id = c.id
      JOIN client_mgmt.users u ON i.invited_by = u.id
      WHERE i.token = $1
    `;

    const result = await this.connector.query(query, [token]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Accept an invitation - creates user if needed and adds to client
   * @param {string} token - Invitation token
   * @param {Object} userData - User data for account creation
   * @param {string} userData.email - User email (must match invitation)
   * @param {string} userData.password - User password
   * @param {string} userData.displayName - User display name
   * @returns {Promise<Object>} Result with user and invitation details
   */
  async acceptInvitation(token, userData) {
    return await this.connector.transaction(async (client) => {
      // Get invitation details
      const invitation = await this.getInvitationByToken(token);

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error(`Invitation is ${invitation.status}`);
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      if (invitation.email.toLowerCase() !== userData.email.toLowerCase()) {
        throw new Error('Email address does not match invitation');
      }

      // Check if user already exists
      const existingUserQuery = `
        SELECT id FROM client_mgmt.users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
      `;
      const existingResult = await client.query(existingUserQuery, [userData.email]);

      let userId;
      let userCreated = false;

      if (existingResult.rows.length > 0) {
        // User exists - just add to client
        userId = existingResult.rows[0].id;
      } else {
        // Create new user
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(userData.password, 10);

        const createUserQuery = `
          INSERT INTO client_mgmt.users (email, password_hash, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id
        `;

        const userMetadata = {
          display_name: userData.displayName,
          invitation_accepted: true,
          joined_via_invitation: invitation.id
        };

        const userResult = await client.query(createUserQuery, [
          userData.email,
          passwordHash,
          userMetadata
        ]);

        userId = userResult.rows[0].id;
        userCreated = true;
      }

      // Add user to client (use ON CONFLICT to handle existing relationships)
      const addToClientQuery = `
        INSERT INTO client_mgmt.user_clients (user_id, client_id, role, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (user_id, client_id)
        DO UPDATE SET role = $3, is_active = true
        RETURNING *
      `;

      const clientResult = await client.query(addToClientQuery, [
        userId,
        invitation.client_id,
        invitation.role
      ]);

      // Mark invitation as accepted
      const acceptQuery = `
        UPDATE client_mgmt.invitations
        SET status = 'accepted', accepted_at = NOW(), accepted_by = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const acceptResult = await client.query(acceptQuery, [invitation.id, userId]);

      return {
        user_id: userId,
        user_created: userCreated,
        client_relationship: clientResult.rows[0],
        invitation: acceptResult.rows[0]
      };
    });
  }

  /**
   * Get all invitations for a client
   * @param {number} clientId - Client ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Array of invitation records
   */
  async getClientInvitations(clientId, status = null) {
    let query = `
      SELECT
        i.*,
        u.email as inviter_email,
        u.metadata as inviter_metadata
      FROM client_mgmt.invitations i
      JOIN client_mgmt.users u ON i.invited_by = u.id
      WHERE i.client_id = $1
    `;

    const params = [clientId];

    if (status) {
      query += ' AND i.status = $2';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await this.connector.query(query, params);
    return result.rows;
  }

  /**
   * Revoke a pending invitation
   * @param {number} invitationId - Invitation ID
   * @param {number} revokedBy - User ID of person revoking
   * @returns {Promise<boolean>} True if revoked, false if not found/not pending
   */
  async revokeInvitation(invitationId, revokedBy) {
    const query = `
      UPDATE client_mgmt.invitations
      SET status = 'revoked', updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING id
    `;

    const result = await this.connector.query(query, [invitationId]);
    return result.rows.length > 0;
  }

  /**
   * Clean up expired invitations (call periodically)
   * @returns {Promise<number>} Number of invitations expired
   */
  async expireOldInvitations() {
    const query = `
      UPDATE client_mgmt.invitations
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'pending' AND expires_at < NOW()
    `;

    const result = await this.connector.query(query);
    return result.rowCount;
  }

  /**
   * Check if user can invite others to a client
   * @param {number} userId - User ID
   * @param {number} clientId - Client ID
   * @returns {Promise<boolean>} True if user can invite
   */
  async canUserInvite(userId, clientId) {
    const query = `
      SELECT role FROM client_mgmt.user_clients
      WHERE user_id = $1 AND client_id = $2 AND is_active = true
    `;

    const result = await this.connector.query(query, [userId, clientId]);

    if (result.rows.length === 0) {
      return false; // User not associated with client
    }

    const role = result.rows[0].role;
    // Allow admin and owner roles to invite, not basic members
    return ['admin', 'owner'].includes(role);
  }
}