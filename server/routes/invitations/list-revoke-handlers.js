/**
 * Invitation List and Revoke Handlers
 * Handles listing and revoking invitations with event logging
 */

import { ApiResponses } from '#server/api/api-responses.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { extractRequestContext } from '../../events/event-logger.js';

/**
 * List invitations handler
 */
export async function handleListInvitations(req, res) {
  const db = new DatabaseAgent();
  try {
    await db.connect();

    const clientId = req.session?.user?.client_id;
    const { status } = req.query; // optional filter

    if (!clientId) {
      return ApiResponses.error(res, 400, 'No client selected');
    }

    const invitations = await db.invitations.getClientInvitations(clientId, status);

    return ApiResponses.success(res, { invitations });

  } catch (error) {
    console.error('List invitations error:', error);

    // Log error to event system
    try {
      if (!db.connector.isConnected) {
        await db.connect();
      }
      await db.logError('invitation_list_error', error, {
        ...extractRequestContext(req),
        clientId: req.session?.user?.client_id,
        statusFilter: req.query.status,
        component: 'Invitations'
      });
    } catch (logError) {
      console.error('Failed to log invitation list error:', logError);
    }

    return ApiResponses.error(res, 500, 'Failed to list invitations');
  } finally {
    await db?.close();
  }
}

/**
 * Revoke invitation handler
 */
export async function handleRevokeInvitation(req, res) {
  const db = new DatabaseAgent();
  try {
    await db.connect();

    const invitationId = parseInt(req.params.id);
    const userId = req.session.user.user_id;
    const clientId = req.session?.user?.client_id;

    if (!clientId) {
      return ApiResponses.error(res, 400, 'No client selected');
    }

    // Check if user can manage invitations
    const canInvite = await db.invitations.canUserInvite(userId, clientId);
    if (!canInvite) {
      return ApiResponses.error(res, 403, 'You do not have permission to revoke invitations');
    }

    const revoked = await db.invitations.revokeInvitation(invitationId, userId);

    if (!revoked) {
      return ApiResponses.error(res, 404, 'Invitation not found or already processed');
    }

    // Log successful revocation
    try {
      await db.logEvent('invitation_revoked', {
        invitation_id: invitationId,
        revoked_by_user_id: userId,
        client_id: clientId
      }, {
        ...extractRequestContext(req),
        component: 'Invitations',
        severity: 'info'
      });
    } catch (logError) {
      console.error('Failed to log invitation revocation:', logError);
    }

    return ApiResponses.success(res, { message: 'Invitation revoked successfully' });

  } catch (error) {
    console.error('Revoke invitation error:', error);

    // Log error to event system
    try {
      if (!db.connector.isConnected) {
        await db.connect();
      }
      await db.logError('invitation_revoke_error', error, {
        ...extractRequestContext(req),
        invitationId: req.params.id,
        clientId: req.session?.user?.client_id,
        component: 'Invitations'
      });
    } catch (logError) {
      console.error('Failed to log invitation revoke error:', logError);
    }

    return ApiResponses.error(res, 500, 'Failed to revoke invitation');
  } finally {
    await db?.close();
  }
}