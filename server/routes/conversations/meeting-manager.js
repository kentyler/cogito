/**
 * Meeting Manager
 * Handles meeting ID resolution and lazy creation
 */

import { createSessionMeeting } from '#server/auth/session-meeting.js';

export async function resolveMeetingId(req, meeting_id) {
  let effectiveMeetingId = meeting_id;
  
  // If no meeting_id provided and no session meeting exists, create one lazily
  if (!effectiveMeetingId && !req.session?.meeting_id) {
    console.log('🔍 No meeting exists - creating one lazily for first turn');
    
    // Ensure we have client info for meeting creation
    if (!req.session?.user?.client_id) {
      throw new Error('Client selection required');
    }
    
    // Create the meeting now that we actually need it
    effectiveMeetingId = await createSessionMeeting({
      pool: req.pool, // deprecated - createSessionMeeting uses DatabaseAgent internally
      userId: req.session.user.user_id || req.session.user.id, 
      clientId: req.session.user.client_id
    });
    
    // Store in session for subsequent turns
    req.session.meeting_id = effectiveMeetingId;
  } else if (!effectiveMeetingId) {
    // Use existing session meeting
    effectiveMeetingId = req.session.meeting_id;
    console.log('🔍 Using session meeting_id:', effectiveMeetingId);
  } else {
    // Use provided meeting_id (e.g., from transcript or other source)
    console.log('🔍 Using provided meeting_id:', effectiveMeetingId);
  }
  
  return effectiveMeetingId;
}