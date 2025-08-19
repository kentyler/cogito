/**
 * Client Management OAuth Extensions
 * Handles client selection for OAuth-authenticated users
 */

import express from 'express';
import { createSessionMeeting } from '../lib/session-meeting.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

/**
 * OAuth-specific client selection logic
 * Handles the specific requirements for OAuth users
 */
async function handleOAuthClientSelection(req, res, user_id, email, client_id) {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    const client = await dbAgent.users.verifyClientAccess(user_id, client_id);
    
    // Get parent_client_id for mini-horde support
    let parent_client_id = null;
    if (client) {
      const clientDetails = await dbAgent.clients.getClientById(client_id);
      parent_client_id = clientDetails?.parent_client_id || null;
    }
    
    if (!client) {
      return res.status(403).json({ error: 'Access denied to selected client' });
    }

    // Create session meeting
    const meeting_id = await createSessionMeeting(req.db, user_id, client.client_id);
    
    // Set up OAuth user session with mini-horde support
    req.session.user = {
      user_id: user_id,
      id: user_id,
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