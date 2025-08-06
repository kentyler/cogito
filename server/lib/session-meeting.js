import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a meeting for a web session and returns the meeting_id
 * @param {Object} pool - Database connection pool
 * @param {number} user_id - User ID
 * @param {number} client_id - Client ID
 * @returns {Promise<string>} meeting_id
 */
export async function createSessionMeeting(pool, user_id, client_id) {
  const meeting_id = uuidv4();
  const sessionTime = new Date().toISOString();
  
  const result = await pool.query(
    `INSERT INTO meetings.meetings (id, name, description, meeting_type, created_by_user_id, client_id, metadata, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      meeting_id,
      `Web Session ${sessionTime}`,
      `Cogito web conversation session started at ${sessionTime}`,
      'cogito_web',
      user_id,
      client_id,
      JSON.stringify({ 
        created_by: 'cogito_web_session',
        session_start: sessionTime,
        platform: 'web'
      }),
      'active'
    ]
  );
  
  return result.rows[0].id;
}