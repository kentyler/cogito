/**
 * Client Info Resolver
 * Handles client information retrieval from meetings
 */

import { DatabaseAgent } from '../../lib/database-agent.js';
import { getClientInfo } from '../../lib/conversation-context.js';

export async function resolveClientInfo(req, meetingId, userId) {
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
    const fallbackInfo = await getClientInfo(req, userId);
    clientId = fallbackInfo.clientId;
    clientName = fallbackInfo.clientName;
  }
  
  console.log('🔍 Client info retrieved:', { clientId, clientName });
  
  return { clientId, clientName };
}