/**
 * Client Management Selection Routes - Client selection and switching
 * POST /select-client - Initial client selection or client switching
 * POST /switch-client - Switch client for authenticated users
 */

import express from 'express';
import { setupClientSession, logClientSelectionEvent } from '../lib/client-session-manager.js';
import { DatabaseAgent } from '../../lib/database-agent.js';
import { createSessionMeeting } from '../lib/session-meeting.js';
import { ApiResponses } from '../../lib/api-responses.js';

const router = express.Router();

// Client selection endpoint (for initial login with multiple clients OR switching clients)
router.post('/select-client', async (req, res) => {
  try {
    const { client_id } = req.body;
    
    if (!client_id) {
      return ApiResponses.badRequest(res, 'Client ID required');
    }
    
    // Check for either pending authentication or already logged in user
    let user_id, email;
    
    if (req.session.pendingUser) {
      // Initial client selection after login
      ({ user_id, email } = req.session.pendingUser);
    } else if (req.session.user) {
      // Switching clients for already logged-in user
      ({ user_id, email } = req.session.user);
      user_id = req.session.user.user_id || req.session.user.id;
    } else {
      return ApiResponses.unauthorized(res, 'Authentication required');
    }
    // Setup client session with mini-horde support
    try {
      const sessionResult = await setupClientSession(req, user_id, email, client_id);
      const { client, parent_client_id } = sessionResult;
      
      // Determine event type before clearing pendingUser
      const isInitialSelection = !!req.session.pendingUser;
      
      // Clear pending user if it exists (for initial selection)
      if (req.session.pendingUser) {
        delete req.session.pendingUser;
      }
      
      req.session.save(async (err) => {
        if (err) {
          return ApiResponses.internalError(res, 'Session creation failed');
        }
        
        // Log client selection event
        const eventType = isInitialSelection ? 'initial_client_selection' : 'client_selection';
        await logClientSelectionEvent(user_id, client, eventType, {
          userId: user_id,
          sessionId: req.sessionID,
          endpoint: `${req.method} ${req.path}`,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent')
        });
        
        return ApiResponses.successMessage(res, 'Client selected successfully', {
          user: { 
            user_id: user_id,
            email: email,
            client: client.client_name,
            client_name: client.client_name,
            client_id: client.client_id,
            role: client.role
          }
        });
      });
    } catch (meetingError) {
      console.error('Failed to create session meeting:', meetingError);
      return ApiResponses.internalError(res, 'Failed to initialize session');
    }
  } catch (error) {
    console.error('Client selection error:', error);
    return ApiResponses.internalError(res, 'Client selection failed');
  }
});

// Switch client (for already authenticated users)
router.post('/switch-client', async (req, res) => {
  try {
    const { client_id } = req.body;
    
    if (!client_id) {
      return ApiResponses.badRequest(res, 'Client ID required');
    }
    
    if (!req.session || !req.session.user) {
      return ApiResponses.unauthorized(res, 'Not authenticated');
    }
    const { user_id, email } = req.session.user;
    
    // Verify user has access to this client and get parent_client_id
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const client = await dbAgent.users.verifyClientAccess(user_id, client_id);
    
    // Get parent_client_id for mini-horde support
    let parent_client_id = null;
    if (client) {
      const clientDetails = await dbAgent.clients.getClientById(client_id);
      parent_client_id = clientDetails?.parent_client_id || null;
    }
    
    await dbAgent.close();
    
    if (!client) {
      return ApiResponses.forbidden(res, 'Access denied to selected client');
    }
    
    // Create new session meeting for the new client
    try {
      const meeting_id = await createSessionMeeting(req.db, user_id, client.client_id);
      
      // Update session with new client including parent_client_id for mini-horde support
      req.session.user = {
        user_id: user_id,
        email: email,
        client_id: client.client_id,
        client_name: client.client_name,
        role: client.role
      };
      req.session.parent_client_id = parent_client_id;
      req.session.meeting_id = meeting_id;
      
      req.session.save(async (err) => {
        if (err) {
          return ApiResponses.internalError(res, 'Session update failed');
        }
        
        // Log client switch event
        try {
          const dbAgent = new DatabaseAgent();
          await dbAgent.connect();
          await dbAgent.logClientEvent('client_switch', {
            client_id: client.client_id,
            client_name: client.client_name,
            user_id: user_id,
            role: client.role,
            previous_client_id: req.session.user?.client_id || null
          }, {
            userId: user_id,
            sessionId: req.sessionID,
            endpoint: `${req.method} ${req.path}`,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent')
          });
          await dbAgent.close();
        } catch (logError) {
          console.error('Failed to log client switch:', logError);
        }
        
        return ApiResponses.successMessage(res, 'Client switched successfully', {
          user: { 
            email: email,
            client: client.client_name,
            role: client.role
          }
        });
      });
    } catch (meetingError) {
      console.error('Failed to create session meeting for client switch:', meetingError);
      return ApiResponses.internalError(res, 'Failed to switch client');
    }
  } catch (error) {
    console.error('Client switch error:', error);
    return ApiResponses.internalError(res, 'Client switch failed');
  }
});

export default router;