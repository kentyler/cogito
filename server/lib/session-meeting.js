import { v4 as uuidv4 } from 'uuid';
import { DatabaseAgent } from '../../lib/database-agent.js';

/**
 * Creates a meeting for a web session and returns the meeting_id
 * @param {Object} pool - Database connection pool (kept for backward compatibility)
 * @param {number} user_id - User ID
 * @param {number} client_id - Client ID
 * @returns {Promise<string>} meeting_id
 */
export async function createSessionMeeting(pool, user_id, client_id) {
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
      created_by_user_id: user_id,
      client_id: client_id,
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