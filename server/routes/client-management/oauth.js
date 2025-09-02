/**
 * Client Management OAuth Extensions
 * Handles client selection for OAuth-authenticated users
 */

import express from 'express';
import { createSessionMeeting } from '#server/auth/session-meeting.js';
import { DatabaseAgent } from '#database/database-agent.js';

const router = express.Router();

/**
 * OAuth-specific client selection logic
 * Handles the specific requirements for OAuth users
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {Object} options.res - Express response object
 * @param {string} options.userId - User ID from OAuth authentication
 * @param {string} options.email - User email from OAuth
 * @param {string} options.clientId - Selected client ID
 * @returns {Promise<Object>} Selection result with client and parent info
 */
async function handleOAuthClientSelection({ req, res, userId, email, clientId }) {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    const client = await dbAgent.users.verifyClientAccess(userId, clientId);
    
    // Get parent_client_id for mini-horde support
    let parent_client_id = null;
    if (client) {
      const clientDetails = await dbAgent.clients.getClientById(clientId);
      parent_client_id = clientDetails?.parent_client_id || null;
    }
    
    if (!client) {
      return ApiResponses.error(res, 403, 'Access denied to selected client');
    }

    // Create session meeting
    const meeting_id = await createSessionMeeting({ pool: req.db, userId, clientId: client.client_id });
    
    // Set up OAuth user session with mini-horde support
    req.session.user = {
      user_id: userId,
      id: userId,
      email: email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role,
      auth_method: 'oauth'
    };
    req.session.parent_client_id = parent_client_id;
    req.session.meeting_id = meeting_id;
    
    return { success: true, client, parent_client_id };
  } finally {
    await dbAgent.close();
  }
}

export { handleOAuthClientSelection };