/**
 * Client Info Resolver
 * Handles client information retrieval from meetings
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { getClientInfo } from '#server/conversations/conversation-context.js';

/**
 * Resolve client information from meeting context
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {string} options.meetingId - Meeting ID to resolve client info from
 * @param {number} options.userId - User ID for fallback client resolution
 * @returns {Promise<Object>} Object with clientId and clientName
 */
export async function resolveClientInfo({ req, meetingId, userId }) {
  console.log('🔍 Getting client info from meeting:', meetingId);
  let clientId = null;
  let clientName = 'your organization';
  
  try {
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const meetingClientInfo = await dbAgent.meetings.getMeetingClientInfo(meetingId);
    await dbAgent.close();
    
    if (meetingClientInfo) {
      clientId = meetingClientInfo.client_id;
      clientName = meetingClientInfo.client_name || clientName;
    }
  } catch (error) {
    console.warn('Could not get client info from meeting:', error.message);
    // Fall back to session-based client info
    const fallbackInfo = await getClientInfo({ req, userId });
    clientId = fallbackInfo.clientId;
    clientName = fallbackInfo.clientName;
  }
  
  console.log('🔍 Client info retrieved:', { clientId, clientName });
  
  return { clientId, clientName };
}