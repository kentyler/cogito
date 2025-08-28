/**
 * Client Session Manager
 * Handles session setup and management for client selection
 */

import { DatabaseAgent } from '#database/database-agent.js';

/**
 * Setup user session with client selection and mini-horde support
 * @param {Object} req - Express request object
 * @param {number} userId - User ID
 * @param {string} email - User email
 * @param {number} clientId - Selected client ID
 * @returns {Object} Session setup result
 */
export async function setupClientSession(req, userId, email, clientId) {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    // Verify user has access to this client and get parent_client_id
    const client = await dbAgent.users.verifyClientAccess(userId, clientId);
    
    let parent_client_id = null;
    if (client) {
      const clientDetails = await dbAgent.clients.getClientById(clientId);
      parent_client_id = clientDetails?.parent_client_id || null;
    }
    
    if (!client) {
      throw new Error('Access denied to selected client');
    }

    // Don't create meeting eagerly - wait for first turn
    // Meeting will be created lazily when the first conversation turn happens
    
    // Set up full session including parent_client_id for mini-horde support
    req.session.user = {
      user_id: userId,
      id: userId,  // Some code uses .id
      email: email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role
    };
    req.session.parent_client_id = parent_client_id;
    // Don't set meeting_id yet - will be created on first turn
    
    return {
      success: true,
      client,
      parent_client_id,
      meeting_id: null  // No meeting created yet
    };
  } finally {
    await dbAgent.close();
  }
}

/**
 * Log client selection event
 * @param {number} userId - User ID
 * @param {Object} client - Client object
 * @param {string} eventType - Event type
 * @param {Object} requestInfo - Request context
 */
export async function logClientSelectionEvent(userId, client, eventType, requestInfo) {
  try {
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    await dbAgent.logClientEvent(eventType, {
      client_id: client.client_id,
      client_name: client.client_name,
      user_id: userId,
      role: client.role
    }, requestInfo);
    await dbAgent.close();
  } catch (logError) {
    console.error('Failed to log client selection:', logError);
  }
}