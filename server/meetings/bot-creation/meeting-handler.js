/**
 * Meeting creation and management functions
 * Database fields verified: client_id, recall_bot_id, created_by_user_id are standard schema fields
 */
import { v4 as uuidv4 } from 'uuid';

export async function createMeetingRecord(db, {
  meetingUrl,
  meetingName,
  userId,
  clientId,
  botId
}) {
  const meetingId = uuidv4();
  
  const result = await db.query(
    `INSERT INTO meetings.meetings (
      id, name, description, meeting_type, 
      created_by_user_id, client_id, metadata, 
      meeting_url, recall_bot_id, status
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
    RETURNING *`,
    [
      meetingId,
      meetingName || `Meeting ${new Date().toISOString()}`,
      `Meeting from ${meetingUrl}`,
      'meeting',
      userId,
      clientId,
      JSON.stringify({ created_by: 'recall_bot', recall_bot_id: botId }),
      meetingUrl,
      botId,
      'joining'
    ]
  );
  
  const meeting = result.rows[0];
  console.log('Meeting created:', meeting.id);
  return meeting;
}

/**
 * Update meeting with email information
 * @param {Object} options
 * @param {Object} options.db - Database connection
 * @param {string} options.meetingId - Meeting ID
 * @param {string} options.email - Email to add to meeting
 * @param {string} options.userId - User ID making the update
 * @returns {Promise<void>}
 */
export async function updateMeetingWithEmail({ db, meetingId, email, userId }) {
  await db.query(
    `UPDATE meetings.meetings 
     SET transcript_email = $1, invited_by_user_id = $2
     WHERE id = $3`,
    [email, userId, meetingId]
  );
  console.log('Meeting record updated with email:', meetingId);
}

/**
 * Link a file to a meeting
 * @param {Object} options
 * @param {Object} options.db - Database connection
 * @param {string} options.meetingId - Meeting ID
 * @param {string} options.fileId - File ID to link
 * @param {string} options.userId - User ID linking the file
 * @returns {Promise<void>}
 */
export async function linkFileToMeeting({ db, meetingId, fileId, userId }) {
  // Standard database fields: meeting_id, file_id, created_by_user_id
  await db.query(
    `INSERT INTO meetings.meeting_files (meeting_id, file_id, file_source, created_by_user_id, created_at) 
     VALUES ($1, $2, $3, $4, NOW())`,
    [meetingId, fileId, 'context', userId]
  );
}