import express from 'express';
import { requireAuth } from './auth.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

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
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Get meeting list with detailed information
router.get('/meetings', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id as block_id,  -- Keep legacy field name for frontend compatibility
        m.name as block_name,       -- Keep legacy field name for frontend compatibility
        m.created_at,
        m.metadata,
        m.meeting_url,
        m.started_at as meeting_start_time,
        m.ended_at as meeting_end_time,
        m.status,
        m.transcript_summary,
        creator.email as created_by_email,
        COUNT(t.id)::integer as turn_count,
        COUNT(CASE WHEN t.content_embedding IS NOT NULL THEN 1 END)::integer as embedded_count,
        COUNT(DISTINCT t.user_id) FILTER (WHERE t.user_id IS NOT NULL)::integer as participant_count,
        array_agg(DISTINCT u.email) FILTER (WHERE u.email IS NOT NULL) as participant_names,
        MIN(t.created_at) as first_turn_time,
        MAX(t.created_at) as last_turn_time
      FROM meetings.meetings m
      LEFT JOIN meetings.turns t ON m.id = t.meeting_id
      LEFT JOIN client_mgmt.users u ON t.user_id = u.id
      LEFT JOIN client_mgmt.users creator ON m.created_by_user_id = creator.id
      WHERE m.meeting_type != 'system'  -- Exclude migration tracking records
        AND m.client_id = $1  -- Filter by current user's client
      GROUP BY m.id, m.name, m.created_at, m.metadata, m.meeting_url, m.started_at, m.ended_at, m.status, m.transcript_summary, creator.email
      ORDER BY m.created_at DESC
    `;
    
    // Get client_id from session
    const clientId = req.session?.user?.client_id;
    if (!clientId) {
      return res.status(401).json({ error: 'Not authenticated or missing client context' });
    }
    
    const result = await req.db.query(query, [clientId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Delete a meeting and all associated data
router.delete('/meetings/:meetingId', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Use DatabaseAgent transaction for proper cleanup
    const result = await dbAgent.transaction(async (client) => {
      // First get all turn IDs for counting
      const turns = await dbAgent.turns.getTurnsByMeetingId(meetingId);
      const turnCount = turns.length;
      
      // Delete all turns for this meeting using turns domain
      const deletedTurnIds = await dbAgent.turns.deleteTurnsByMeetingId(meetingId);
      
      // Delete the meeting record using meetings domain  
      const deletedMeeting = await dbAgent.meetings.deleteMeeting(meetingId);
      
      if (!deletedMeeting) {
        throw new Error('Meeting not found');
      }
      
      return {
        meeting_id: meetingId,
        turns_deleted: turnCount,
        deleted_turn_ids: deletedTurnIds
      };
    });
    
    console.log(`🗑️  Deleted ${result.turns_deleted} turns from meeting ${meetingId}`);
    
    res.json({ 
      success: true, 
      message: `Meeting ${meetingId} and ${result.turns_deleted} associated turns deleted successfully`,
      deleted: {
        meeting_id: result.meeting_id,
        turns_deleted: result.turns_deleted
      }
    });
    
  } catch (error) {
    console.error('Error deleting meeting:', error);
    if (error.message === 'Meeting not found') {
      res.status(404).json({ error: 'Meeting not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete meeting' });
    }
  }
});

export default router;