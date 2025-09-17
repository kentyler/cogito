/**
 * Invitations Routes
 * Handles invitation management with event logging
 */

import express from 'express';
import { requireAuth } from './auth/middleware.js';
import {
  handleSendInvitation,
  handleValidateInvitation,
  handleAcceptInvitation
} from './invitations/handlers.js';
import {
  handleListInvitations,
  handleRevokeInvitation
} from './invitations/list-revoke-handlers.js';

const router = express.Router();

// Send invitation
router.post('/send', requireAuth, handleSendInvitation);

// Validate invitation token
router.get('/validate/:token', handleValidateInvitation);

// Accept invitation and set password
router.post('/accept', handleAcceptInvitation);

// List invitations for current client
router.get('/list', requireAuth, handleListInvitations);

// Revoke invitation
router.post('/revoke/:id', requireAuth, handleRevokeInvitation);

export default router;