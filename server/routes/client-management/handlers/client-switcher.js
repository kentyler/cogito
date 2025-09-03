/**
 * Client Switcher Handler
 * Handles client switching for authenticated users
 */

import { setupClientSession, logClientSelectionEvent } from '#server/auth/client-session-manager.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { createSessionMeeting } from '#server/auth/session-meeting.js';
import { ApiResponses } from '#server/api/api-responses.js';

export async function handleClientSwitch(req, res) {
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
    
    if (!client) {
      await dbAgent.close();
      return ApiResponses.forbidden(res, 'No access to this client');
    }
    
    // Set up client session (updates existing session)
    await setupClientSession({
      req,
      userId: user_id,
      clientId: client,
      email
    });
    
    // Create a new session meeting for the new client context
    const meeting_id = await createSessionMeeting({ 
      pool: req.db, 
      userId: user_id, 
      clientId: client_id 
    });
    req.session.meeting_id = meeting_id;
    
    // Log client switch event
    await logClientSelectionEvent({
      userId: user_id,
      client: {
        client_id: client_id,
        client_name: client.client_name,
        role: client.role
      },
      eventType: 'client_switched',
      requestInfo: {
        userId: user_id,
        from_client_id: req.session.user.client_id,
        to_client_id: client_id,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    await dbAgent.close();
    
    // Save session and respond
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return ApiResponses.internalError(res, 'Session save failed');
      }
      
      return ApiResponses.successMessage(res, 'Client switched successfully', {
        user: {
          email,
          client: client.client_name
        },
        meeting_id
      });
    });
    
  } catch (error) {
    console.error('Client switch error:', error);
    return ApiResponses.internalError(res, 'Client switch failed');
  }
}