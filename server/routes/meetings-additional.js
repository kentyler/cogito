import express from 'express';
import { DatabaseAgent } from '../../lib/database-agent.js';

// Import route modules
import meetingSummariesRouter from './meeting-summaries.js';

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
    console.error('Database connection error in meetings-additional:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Use summary routes
router.use('/', meetingSummariesRouter);

// Admin routes (simplified - only the most essential)
router.get('/admin/meetings/:meetingId/turns-direct', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.session?.user?.user_id;
    
    if (!userId || (userId !== '1' && req.session?.user?.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const turnsResult = await req.db.query(`
      SELECT t.id, t.content, t.source_type, t.metadata, t.timestamp, 
             t.created_at, t.meeting_index, t.user_id
      FROM meetings.turns t
      WHERE t.meeting_id = $1
      ORDER BY t.created_at ASC
    `, [meetingId]);
    
    res.json({
      turns: turnsResult.rows,
      meeting_id: meetingId,
      query_type: 'direct'
    });
    
  } catch (error) {
    console.error('Error fetching turns directly:', error);
    res.status(500).json({ error: 'Failed to fetch turns directly' });
  }
});

router.get('/admin/meetings/:meetingId/transcript', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.session?.user?.user_id;
    
    if (!userId || (userId !== '1' && req.session?.user?.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const transcript = await dbAgent.meetings.getTranscript(meetingId);
    res.json({ full_transcript: transcript });
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

// Meeting creation route
router.post('/meetings/create', async (req, res) => {
  try {
    const { meeting_name } = req.body;
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const newMeeting = await dbAgent.meetings.create({
      name: meeting_name,
      clientId: req.session?.user?.client_id || 1,
      createdByUserId: userId
    });
    
    res.json({
      meeting_id: newMeeting.id,
      name: newMeeting.name
    });
    
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

export default router;