/**
 * Login Handler
 * Handles user authentication and session creation
 */

import { createSessionMeeting } from '#server/auth/session-meeting.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';

export async function handleLogin(req, res) {
  let dbAgent;
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return ApiResponses.badRequest(res, 'Email and password required');
    }
    
    // Initialize DatabaseAgent for this request
    dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    // Authenticate user using DatabaseAgent (handles its own event logging)
    const authenticatedUser = await dbAgent.users.authenticate(email, password);
    
    if (!authenticatedUser) {
      return ApiResponses.unauthorized(res, 'Invalid credentials');
    }
    
    // Get client associations using DatabaseAgent
    const clients = await dbAgent.users.getUserClients(authenticatedUser.id);
    
    if (clients.length === 0) {
      return ApiResponses.forbidden(res, 'No active client access');
    }
    
    if (clients.length === 1) {
      // Auto-select the only client and create session meeting
      await handleSingleClientLogin(req, res, authenticatedUser, clients[0]);
    } else {
      // Multiple clients - need selection
      handleMultiClientLogin(req, res, authenticatedUser, clients);
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return ApiResponses.internalError(res, 'Login failed');
  } finally {
    await dbAgent?.close();
  }
}

async function handleSingleClientLogin(req, res, user, client) {
  try {
    const meeting_id = await createSessionMeeting(req.db, user.id, client.client_id);
    
    req.session.user = {
      user_id: user.id,
      id: user.id,  // Some code uses .id
      email: user.email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role
    };
    req.session.meeting_id = meeting_id;
    
    req.session.save((err) => {
      if (err) {
        return ApiResponses.internalError(res, 'Session creation failed');
      }
      
      return ApiResponses.successMessage(res, 'Login successful', {
        user: { 
          email: user.email,
          client: client.client_name
        }
      });
    });
  } catch (meetingError) {
    console.error('Failed to create session meeting:', meetingError);
    return ApiResponses.internalError(res, 'Failed to initialize session');
  }
}

function handleMultiClientLogin(req, res, user, clients) {
  req.session.pendingUser = {
    user_id: user.id,
    email: user.email
  };
  
  req.session.save((err) => {
    if (err) {
      return ApiResponses.internalError(res, 'Session creation failed');
    }
    
    return ApiResponses.successMessage(res, 'Client selection required', {
      requiresClientSelection: true,
      clients: clients
    });
  });
}