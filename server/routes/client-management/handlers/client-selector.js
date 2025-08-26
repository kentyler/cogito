/**
 * Client Selection Handler
 * Handles initial client selection after login
 */

import { setupClientSession, logClientSelectionEvent } from '../../lib/client-session-manager.js';
import { DatabaseAgent } from '../../../lib/database-agent.js';
import { createSessionMeeting } from '../../lib/session-meeting.js';
import { ApiResponses } from '../../lib/api-responses.js';

export async function handleClientSelection(req, res) {
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
      // Client switching for already authenticated users
      ({ user_id, email } = req.session.user);
    } else {
      return ApiResponses.unauthorized(res, 'Authentication required');
    }
    
    // Verify user has access to this client and get parent_client_id
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const client = await dbAgent.users.verifyClientAccess(user_id, client_id);
    
    if (!client) {
      await dbAgent.close();
      return ApiResponses.forbidden(res, 'No access to this client');
    }
    
    // Set up client session
    await setupClientSession(req, user_id, client, email);
    
    // Create a new session meeting for this client context
    const meeting_id = await createSessionMeeting(req.db, user_id, client_id);
    req.session.meeting_id = meeting_id;
    
    // Log client selection event
    await logClientSelectionEvent(dbAgent, 'client_selected', {
      user_id,
      client_id,
      client_name: client.client_name,
      parent_client_id: client.parent_client_id,
      email,
      selection_type: req.session.pendingUser ? 'initial' : 'switch'
    }, {
      userId: user_id,
      sessionId: req.sessionID,
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    await dbAgent.close();
    
    // Save session and respond
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return ApiResponses.internalError(res, 'Session save failed');
      }
      
      return ApiResponses.successMessage(res, 'Client selected successfully', {
        user: {
          email,
          client: client.client_name
        },
        meeting_id
      });
    });
    
  } catch (error) {
    console.error('Client selection error:', error);
    return ApiResponses.internalError(res, 'Client selection failed');
  }
}