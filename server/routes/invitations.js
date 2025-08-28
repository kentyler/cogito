import { ApiResponses } from '#server/api/api-responses.js';
import express from 'express';
import { requireAuth } from './auth/middleware.js';
import { InvitationService } from '#server/events/invitation-service.js';
import { sendInvitationEmail } from '#server/events/invitation-email.js';

const router = express.Router();

// Send invitation
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const invitingUserId = req.user.id;
    const clientId = req.session?.user?.client_id;
    
    if (!email) {
      return ApiResponses.error(res, 400, 'Email is required');
    }
    
    if (!clientId) {
      return ApiResponses.error(res, 400, 'No client selected');
    }
    
    const invitationService = new InvitationService(req.db);
    const { invitationToken } = await invitationService.createOrUpdateInvitation(
      email, 
      invitingUserId, 
      clientId
    );
    
    // Send invitation email
    await sendInvitationEmail(email, req.session.user.email, invitationToken);
    
    res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      email: email 
    });
    
  } catch (error) {
    console.error('Invitation error:', error);
    return ApiResponses.error(res, 500, error.message || 'Failed to send invitation');
  }
});

// Validate invitation token
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitationService = new InvitationService(req.db);
    const user = await invitationService.validateToken(token);
    
    if (!user) {
      return ApiResponses.error(res, 400, 'Invalid or expired invitation');
    }
    
    res.json({ 
      valid: true, 
      email: user.email 
    });
    
  } catch (error) {
    console.error('Token validation error:', error);
    return ApiResponses.error(res, 500, 'Failed to validate invitation');
  }
});

// Accept invitation and set password
router.post('/accept', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return ApiResponses.error(res, 400, 'Token and password are required');
    }
    
    const invitationService = new InvitationService(req.db);
    const user = await invitationService.acceptInvitation(token, password);
    
    res.json({ 
      success: true, 
      message: 'Password set successfully. You can now log in.',
      email: user.email
    });
    
  } catch (error) {
    console.error('Accept invitation error:', error);
    return ApiResponses.error(res, 500, error.message || 'Failed to accept invitation');
  }
});

// List pending invitations for current client
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const clientId = req.session?.user?.client_id;
    
    if (!clientId) {
      return ApiResponses.error(res, 400, 'No client selected');
    }
    
    const invitationService = new InvitationService(req.db);
    const invitations = await invitationService.getPendingInvitations(clientId);
    
    return ApiResponses.success(res, { invitations });
    
  } catch (error) {
    console.error('List invitations error:', error);
    return ApiResponses.error(res, 500, 'Failed to list invitations');
  }
});

export default router;