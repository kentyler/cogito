import express from 'express';
import { requireAuth } from './auth.js';
import { DatabaseAgent } from '../../lib/database-agent.js';
import { ApiResponses } from '../../lib/api-responses.js';

const router = express.Router();
const dbAgent = new DatabaseAgent();

// Middleware to ensure DatabaseAgent connection
router.use(async (req, res, next) => {
  try {
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    next();
  } catch (error) {
    console.error('Database connection error in meetings-crud:', error);
    return ApiResponses.databaseError(res);
  }
});

// Get meeting list with detailed information
router.get('/meetings', requireAuth, async (req, res) => {
  try {
    // Get client_id from session
    const clientId = req.session?.user?.client_id;
    if (!clientId) {
      return ApiResponses.unauthorized(res, 'Not authenticated or missing client context');
    }
    
    // Use DatabaseAgent to fetch meetings with stats
    const meetings = await dbAgent.meetings.listWithStats(clientId, {
      excludeSystemMeetings: true,
      limit: 100  // Reasonable default limit
    });
    
    return ApiResponses.success(res, meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return ApiResponses.internalError(res, 'Failed to fetch meetings');
  }
});

// Delete a meeting and all associated data
router.delete('/meetings/:meetingId', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Use DatabaseAgent transaction for proper cleanup
    const result = await dbAgent.transaction(async (client) => {
      // First get all turns for counting
      const turns = await dbAgent.turns.getByMeetingId(meetingId);
      const turnCount = turns.length;
      
      // Delete all turns for this meeting using turns domain
      const deletedTurns = await dbAgent.turns.deleteByMeetingId(meetingId);
      
      // Delete the meeting record using meetings domain  
      const deletedMeeting = await dbAgent.meetings.deleteMeeting(meetingId);
      
      if (!deletedMeeting) {
        throw new Error('Meeting not found');
      }
      
      return {
        meeting_id: meetingId,
        turns_deleted: turnCount,
        deleted_turns: deletedTurns
      };
    });
    
    console.log(`🗑️  Deleted ${result.turns_deleted} turns from meeting ${meetingId}`);
    
    return ApiResponses.successMessage(res, 
      `Meeting ${meetingId} and ${result.turns_deleted} associated turns deleted successfully`,
      {
        deleted: {
          meeting_id: result.meeting_id,
          turns_deleted: result.turns_deleted
        }
      }
    );
    
  } catch (error) {
    console.error('Error deleting meeting:', error);
    if (error.message === 'Meeting not found') {
      return ApiResponses.notFound(res, 'Meeting not found');
    } else {
      return ApiResponses.internalError(res, 'Failed to delete meeting');
    }
  }
});

export default router;