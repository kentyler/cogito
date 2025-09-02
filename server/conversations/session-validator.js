/**
 * Session and meeting validation for conversations
 */
import { createSessionMeeting } from '#server/auth/session-meeting.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function validateAndGetUserId(req) {
  console.log('🔍 STEP 2: Checking authentication');
  
  if (req.session && req.session.user) {
    const userId = req.session.user.user_id;
    console.log('🔍 STEP 2a: Found authenticated user:', userId);
    return userId;
  } else if (process.env.NODE_ENV !== 'production') {
    // Default to user 1 (ken@8thfold.com) in development
    console.log('🔍 STEP 2b: Development mode: Using default user_id=1');
    return 1;
  } else {
    console.log('🔍 STEP 2c: No authentication found');
    return null;
  }
}

export async function validateContent(content) {
  if (!content) {
    console.log('🔍 STEP 3: No content provided');
    return false;
  }
  console.log('🔍 STEP 3: Content validation passed');
  return true;
}

/**
 * Ensure meeting exists for session (DISABLED function)
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {Object} options.db - Database connection
 * @returns {Promise<string>} Meeting ID
 */
export async function ensureMeetingExists_DISABLED({ req, db }) {
  let meetingId = req.session?.meeting_id;
  
  // Debug logging
  console.log('Session data:', {
    sessionId: req.sessionID,
    meeting_id: meetingId,
    user: req.session?.user
  });
  
  // Validate that meeting_id is a valid UUID
  if (!meetingId || !UUID_REGEX.test(meetingId)) {
    console.log('Creating new session meeting due to missing or invalid meeting_id:', meetingId);
    
    // Get client_id from session user or use default
    const clientId = req.session?.user?.client_id || 1;
    const userId = req.session?.user?.user_id || 1;
    
    try {
      meetingId = await createSessionMeeting(db, userId, clientId);
      req.session.meeting_id = meetingId;
      
      // Save session with new meeting_id
      await new Promise((resolve, reject) => {
        req.session.save(err => err ? reject(err) : resolve());
      });
      
      console.log('Created new session meeting:', meetingId);
    } catch (error) {
      console.error('Failed to create session meeting:', error);
      throw new Error('Failed to create session meeting. Please try refreshing the page.');
    }
  }
  
  return meetingId;
}