/**
 * Invitation Route Handlers
 * Split from main invitations route to maintain file size limits
 */

import { ApiResponses } from '#server/api/api-responses.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { InvitationEmailService } from '../../services/invitation-email-service.js';
import { extractRequestContext } from '../../events/event-logger.js';

/**
 * Send invitation handler
 */
export async function handleSendInvitation(req, res) {
  const db = new DatabaseAgent();
  try {
    await db.connect();

    const { email, recipientName, personalMessage } = req.body;
    const invitingUserId = req.session.user.user_id;
    const clientId = req.session?.user?.client_id;

    if (!email) {
      return ApiResponses.error(res, 400, 'Email is required');
    }

    if (!clientId) {
      return ApiResponses.error(res, 400, 'No client selected');
    }

    // Check if user can invite
    const canInvite = await db.invitations.canUserInvite(invitingUserId, clientId);
    if (!canInvite) {
      return ApiResponses.error(res, 403, 'You do not have permission to send invitations');
    }

    // Create invitation
    const invitation = await db.invitations.createInvitation({
      email,
      clientId,
      invitedBy: invitingUserId,
      recipientName,
      personalMessage
    });

    // Send invitation email
    const emailService = new InvitationEmailService();
    await emailService.sendInvitationEmail({
      email,
      inviterEmail: req.session.user.email,
      invitationToken: invitation.token,
      recipientName,
      personalMessage
    });

    // Log successful invitation send
    try {
      await db.logEvent('invitation_sent', {
        invitation_id: invitation.id,
        invitee_email: email,
        inviter_user_id: invitingUserId,
        client_id: clientId,
        has_personal_message: !!personalMessage,
        expires_at: invitation.expires_at
      }, {
        ...extractRequestContext(req),
        component: 'Invitations',
        severity: 'info'
      });
    } catch (logError) {
      console.error('Failed to log invitation success:', logError);
    }

    return ApiResponses.success(res, {
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Invitation error:', error);

    // Log error to event system
    try {
      if (!db.connector.isConnected) {
        await db.connect();
      }
      await db.logError('invitation_send_error', error, {
        ...extractRequestContext(req),
        inviteeEmail: req.body.email,
        clientId: req.session?.user?.client_id,
        component: 'Invitations'
      });
    } catch (logError) {
      console.error('Failed to log invitation error:', logError);
    }

    return ApiResponses.error(res, 500, error.message || 'Failed to send invitation');
  } finally {
    await db?.close();
  }
}

/**
 * Validate invitation token handler
 */
export async function handleValidateInvitation(req, res) {
  const db = new DatabaseAgent();
  try {
    await db.connect();

    const { token } = req.params;
    const invitation = await db.invitations.getInvitationByToken(token);

    if (!invitation) {
      return ApiResponses.error(res, 404, 'Invitation not found');
    }

    if (invitation.status !== 'pending') {
      return ApiResponses.error(res, 400, `Invitation is ${invitation.status}`);
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return ApiResponses.error(res, 400, 'Invitation has expired');
    }

    return ApiResponses.success(res, {
      valid: true,
      email: invitation.email,
      clientName: invitation.client_name,
      inviterEmail: invitation.inviter_email
    });

  } catch (error) {
    console.error('Token validation error:', error);

    // Log error to event system
    try {
      if (!db.connector.isConnected) {
        await db.connect();
      }
      await db.logError('invitation_validation_error', error, {
        ...extractRequestContext(req),
        token: req.params.token,
        component: 'Invitations'
      });
    } catch (logError) {
      console.error('Failed to log invitation validation error:', logError);
    }

    return ApiResponses.error(res, 500, 'Failed to validate invitation');
  } finally {
    await db?.close();
  }
}

/**
 * Accept invitation handler
 */
export async function handleAcceptInvitation(req, res) {
  const db = new DatabaseAgent();
  try {
    await db.connect();

    const { token, password, displayName } = req.body;

    if (!token || !password) {
      return ApiResponses.error(res, 400, 'Token and password are required');
    }

    if (password.length < 8) {
      return ApiResponses.error(res, 400, 'Password must be at least 8 characters');
    }

    // Get invitation details first
    const invitation = await db.invitations.getInvitationByToken(token);
    if (!invitation) {
      return ApiResponses.error(res, 404, 'Invitation not found');
    }

    // Accept the invitation
    const result = await db.invitations.acceptInvitation(token, {
      email: invitation.email,
      password,
      displayName: displayName || invitation.email.split('@')[0]
    });

    // Log successful invitation acceptance
    try {
      await db.logEvent('invitation_accepted', {
        invitation_id: invitation.id,
        user_id: result.user_id,
        email: invitation.email,
        user_created: result.user_created,
        client_id: invitation.client_id
      }, {
        ...extractRequestContext(req),
        component: 'Invitations',
        severity: 'info'
      });
    } catch (logError) {
      console.error('Failed to log invitation acceptance:', logError);
    }

    return ApiResponses.success(res, {
      message: 'Account created successfully. You can now log in.',
      email: invitation.email,
      userCreated: result.user_created
    });

  } catch (error) {
    console.error('Accept invitation error:', error);

    // Log error to event system
    try {
      if (!db.connector.isConnected) {
        await db.connect();
      }
      await db.logError('invitation_acceptance_error', error, {
        ...extractRequestContext(req),
        token: req.body.token,
        component: 'Invitations'
      });
    } catch (logError) {
      console.error('Failed to log invitation acceptance error:', logError);
    }

    return ApiResponses.error(res, 500, error.message || 'Failed to accept invitation');
  } finally {
    await db?.close();
  }
}