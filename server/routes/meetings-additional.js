import express from 'express';
import { v4 as uuidv4 } from 'uuid';
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
    console.error('Database connection error in meetings-additional:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

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

// Get turns directly - bypasses meeting lookup
router.get('/admin/meetings/:meetingId/turns-direct', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.session?.user?.user_id;
    
    // Check if user is admin
    const isAdmin = userId && (userId === '1' || req.session?.user?.role === 'admin');
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log(`🔍 Direct turns request for meeting ID: ${meetingId}`);
    
    // Get turns directly from the turns table
    const turnsQuery = `
      SELECT 
        t.id,
        t.content,
        t.source_type,
        t.metadata,
        t.timestamp,
        t.created_at,
        t.meeting_index,
        t.user_id
      FROM meetings.turns t
      WHERE t.meeting_id = $1
      ORDER BY t.created_at ASC
    `;
    
    const turnsResult = await req.db.query(turnsQuery, [meetingId]);
    
    console.log(`📋 Direct query found ${turnsResult.rows.length} turns for meeting ${meetingId}`);
    
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

// Get meeting turns - simple version
router.get('/admin/meetings/:meetingId/transcript', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.session?.user?.user_id;
    
    // Check if user is admin
    const isAdmin = userId && (userId === '1' || req.session?.user?.role === 'admin');
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log(`🔍 Simple transcript request for meeting ID: ${meetingId}`);
    
    // First, get just the turns
    const turnsQuery = `
      SELECT 
        t.id,
        t.content,
        t.source_type,
        t.metadata,
        t.timestamp,
        t.created_at,
        t.meeting_index
      FROM meetings.turns t
      WHERE t.meeting_id = $1
      ORDER BY t.created_at ASC
    `;
    
    const turnsResult = await req.db.query(turnsQuery, [meetingId]);
    
    console.log(`📋 Found ${turnsResult.rows.length} turns for meeting ${meetingId}`);
    
    if (turnsResult.rows.length > 0) {
      console.log(`✅ Returning ${turnsResult.rows.length} turns`);
      res.json({
        turns: turnsResult.rows
      });
    } else {
      // If no turns, try to get meeting with full_transcript
      const meetingQuery = `
        SELECT id, name, full_transcript
        FROM meetings.meetings
        WHERE id = $1
      `;
      
      const meetingResult = await req.db.query(meetingQuery, [meetingId]);
      
      if (meetingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Meeting not found' });
      }
      
      const meeting = meetingResult.rows[0];
      
      if (meeting.full_transcript) {
        console.log(`✅ Returning full_transcript (${meeting.full_transcript.length} chars)`);
        res.json({
          full_transcript: meeting.full_transcript
        });
      } else {
        console.log(`✅ No turns or transcript found`);
        res.json({ turns: [] });
      }
    }
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
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
    
    // Create meeting using meeting operations domain
    const meetingData = {
      name: meeting_name,
      description: `Conversation meeting created on ${new Date().toISOString()}`,
      meeting_type: 'conversation',
      created_by_user_id: user_id,
      client_id: client_id,
      metadata: { source: 'conversational-repl' }
    };
    
    const meeting = await dbAgent.meetings.createMeeting(meetingData);
    
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