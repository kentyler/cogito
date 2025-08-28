import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class InvitationService {
  constructor(db) {
    this.db = db;
  }

  async createOrUpdateInvitation(email, invitingUserId, clientId) {
    // Check if user already exists
    const existingUser = await this.db.query(
      'SELECT id, email, password_hash FROM client_mgmt.users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if (existingUser.rows.length > 0 && existingUser.rows[0].password_hash) {
      throw new Error('User already exists and has access');
    }
    
    let userId;
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (existingUser.rows.length > 0) {
      // User exists but has no password - update with new invitation
      userId = existingUser.rows[0].id;
      await this.db.query(
        `UPDATE client_mgmt.users 
         SET invitation_token = $1, 
             invitation_expires = $2,
             invited_by_user_id = $3,
             invited_at = NOW()
         WHERE id = $4`,
        [invitationToken, expiresAt, invitingUserId, userId]
      );
    } else {
      // Create new user without password
      const newUser = await this.db.query(
        `INSERT INTO client_mgmt.users 
         (email, invitation_token, invitation_expires, invited_by_user_id, invited_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING id`,
        [email, invitationToken, expiresAt, invitingUserId]
      );
      userId = newUser.rows[0].id;
    }
    
    // Create user-client association
    await this.db.query(
      `INSERT INTO client_mgmt.user_clients (user_id, client_id, role, is_active)
       VALUES ($1, $2, 'member', true)
       ON CONFLICT (user_id, client_id) DO UPDATE
       SET is_active = true`,
      [userId, clientId]
    );
    
    return { userId, invitationToken, email };
  }

  async validateToken(token) {
    const result = await this.db.query(
      `SELECT id, email, invitation_expires 
       FROM client_mgmt.users 
       WHERE invitation_token = $1 
       AND password_hash IS NULL 
       AND invitation_expires > NOW()`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  async acceptInvitation(token, password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Find user with valid token
    const userResult = await this.db.query(
      `SELECT id, email 
       FROM client_mgmt.users 
       WHERE invitation_token = $1 
       AND password_hash IS NULL 
       AND invitation_expires > NOW()`,
      [token]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Invalid or expired invitation');
    }
    
    const user = userResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update user with password and clear invitation fields
    await this.db.query(
      `UPDATE client_mgmt.users 
       SET password_hash = $1,
           invitation_token = NULL,
           invitation_expires = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );
    
    return user;
  }

  async getPendingInvitations(clientId) {
    const result = await this.db.query(
      `SELECT 
        u.id,
        u.email,
        u.invited_at,
        u.invitation_expires,
        inviter.email as invited_by
       FROM client_mgmt.users u
       JOIN client_mgmt.user_clients uc ON u.id = uc.user_id
       LEFT JOIN client_mgmt.users inviter ON u.invited_by_user_id = inviter.id
       WHERE uc.client_id = $1
       AND u.password_hash IS NULL
       AND u.invitation_token IS NOT NULL
       AND u.invitation_expires > NOW()
       ORDER BY u.invited_at DESC`,
      [clientId]
    );
    
    return result.rows;
  }
}