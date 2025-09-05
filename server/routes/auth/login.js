/**
 * Login Handler
 * Handles user authentication and session creation
 */

import { createSessionMeeting } from '#server/auth/session-meeting.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';
import { EventLogger, extractRequestContext } from '#server/events/event-logger.js';

export async function handleLogin(req, res) {
  let dbAgent;
  try {
    // Validate request body exists
    if (!req.body) {
      return ApiResponses.badRequest(res, 'Request body required');
    }
    
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
      await handleSingleClientLogin({
        req,
        res, 
        user: authenticatedUser,
        client: clients[0]
      });
    } else {
      // Multiple clients - need selection
      handleMultiClientLogin({
        req,
        res,
        user: authenticatedUser,
        clients
      });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Log error as event to database
    const eventLogger = new EventLogger(req.pool);
    const context = extractRequestContext(req);
    await eventLogger.logError('auth_login_error', error, context);
    
    return ApiResponses.internalError(res, 'Login failed');
  } finally {
    await dbAgent?.close();
  }
}

/**
 * Handle single client login workflow
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {Object} options.res - Express response object  
 * @param {Object} options.user - Authenticated user object with id and email
 * @param {Object} options.client - Client object with client_id, client_name, and role
 * @returns {Promise<void>} Resolves when login is complete
 */
async function handleSingleClientLogin({ req, res, user, client }) {
  try {
    const meeting_id = await createSessionMeeting({ 
      pool: req.db, 
      userId: user.id, 
      clientId: client.client_id 
    });
    
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
    
    // Log error as event to database
    const eventLogger = new EventLogger(req.pool);
    const context = extractRequestContext(req);
    await eventLogger.logError('session_meeting_creation_error', meetingError, context);
    
    return ApiResponses.internalError(res, 'Failed to initialize session');
  }
}

/**
 * Handle multi-client login workflow
 * @param {Object} options
 * @param {Object} options.req - Express request object with session
 * @param {Object} options.res - Express response object
 * @param {Object} options.user - Authenticated user object with id and email
 * @param {Array<Object>} options.clients - Array of client objects user has access to
 * @returns {void} Sends response requiring client selection
 */
function handleMultiClientLogin({ req, res, user, clients }) {
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