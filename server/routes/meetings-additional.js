import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Meeting summary endpoint
router.get('/meeting-summary/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const summary = await req.similarityOrchestrator.getSummaryStats(meetingId);
    res.json(summary);
  } catch (error) {
    console.error('Meeting summary error:', error);
    res.status(500).json({ error: 'Failed to get meeting summary' });
  }
});

// Compare meetings endpoint
router.post('/compare-meetings', async (req, res) => {
  try {
    const { meetingId1, meetingId2, options = {} } = req.body;
    
    if (!meetingId1 || !meetingId2) {
      return res.status(400).json({ error: 'Two meeting IDs are required' });
    }
    
    const comparison = await req.similarityOrchestrator.compareBlocks(meetingId1, meetingId2, options);
    res.json(comparison);
    
  } catch (error) {
    console.error('Meeting comparison error:', error);
    res.status(500).json({ error: 'Failed to compare meetings' });
  }
});

// Create a simple meeting for conversation
router.post('/meetings/create', async (req, res) => {
  try {
    const { meeting_name } = req.body;
    const user_id = req.session.user.user_id || req.session.user.id;
    const client_id = req.session.user.client_id;
    
    if (!meeting_name) {
      return res.status(400).json({ error: 'Meeting name is required' });
    }
    
    // Create a meeting
    const meetingResult = await req.db.query(
      `INSERT INTO meetings.meetings (name, description, meeting_type, created_by_user_id, client_id, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        meeting_name,
        `Conversation meeting created on ${new Date().toISOString()}`,
        'conversation',
        user_id,
        client_id,
        { source: 'conversational-repl' }
      ]
    );
    
    const meeting = meetingResult.rows[0];
    
    // Return the meeting info
    res.json({
      meeting_id: meeting.id,
      name: meeting.name,
      created_at: meeting.created_at,
      status: 'active'
    });
    
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

export default router;