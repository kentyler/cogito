import { v4 as uuidv4 } from 'uuid';
import { DatabaseAgent } from '#database/database-agent.js';

/**
 * Creates a meeting for a web session and returns the meeting_id
 * @param {Object} options
 * @param {Object} [options.pool] - Database connection pool (kept for backward compatibility)
 * @param {number} options.userId - User ID who is starting the session
 * @param {number} options.clientId - Client ID for the session meeting
 * @returns {Promise<string>} meeting_id
 */
export async function createSessionMeeting({ pool, userId, clientId }) {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    const meeting_id = uuidv4();
    const sessionTime = new Date().toISOString();
    
    const meetingData = {
      id: meeting_id,
      name: `Web Session ${sessionTime}`,
      description: `Cogito web conversation session started at ${sessionTime}`,
      meeting_type: 'cogito_web',
      created_by_user_id: userId,
      client_id: clientId,
      metadata: { 
        created_by: 'cogito_web_session',
        session_start: sessionTime,
        platform: 'web'
      },
      status: 'active'
    };
    
    const result = await dbAgent.meetings.create(meetingData);
    
    return result.id;
  } finally {
    await dbAgent.close();
  }
}