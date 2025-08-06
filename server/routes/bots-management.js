import express from 'express';
import { requireAuth } from './auth.js';

const router = express.Router();

// Get running bots endpoint
router.get('/bots', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user.user_id || req.session.user.id;
    
    const result = await req.db.query(`
      SELECT 
        id,
        recall_bot_id as bot_id,
        meeting_url,
        name as meeting_name,
        status,
        created_at,
        updated_at
      FROM meetings.meetings
      WHERE status = 'active' AND meeting_type != 'system'
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bots:', error);
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// Get stuck meetings endpoint
router.get('/stuck-meetings', requireAuth, async (req, res) => {
  try {
    console.log('Fetching stuck meetings...');
    const result = await req.db.query(`
      SELECT 
        id,
        recall_bot_id as meeting_id,
        meeting_url,
        name as meeting_name,
        status,
        created_at,
        updated_at,
        recall_bot_id as bot_id,
        0 as turn_count
      FROM meetings.meetings
      WHERE status = 'joining' AND meeting_type != 'system'
      ORDER BY created_at DESC
    `);
    
    console.log('Found stuck meetings:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stuck meetings:', error);
    res.status(500).json({ error: 'Failed to fetch stuck meetings' });
  }
});

// Force complete stuck meeting endpoint
router.post('/stuck-meetings/:meetingId/complete', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Update the meeting status to completed
    const result = await req.db.query(`
      UPDATE meetings.meetings 
      SET status = 'completed', updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING *
    `, [meetingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Note: Only updating meetings table since that's where the meeting status is tracked
    
    res.json({ 
      success: true, 
      message: 'Meeting marked as completed',
      meeting: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing stuck meeting:', error);
    res.status(500).json({ error: 'Failed to complete meeting' });
  }
});

// Shutdown bot endpoint
router.post('/bots/:botId/leave', requireAuth, async (req, res) => {
  try {
    const { botId } = req.params;
    const user_id = req.session.user.user_id || req.session.user.id;
    
    console.log(`Shutting down bot ${botId} for user ${user_id}`);
    
    // Update the bot status to leaving in meetings table
    const updateResult = await req.db.query(`
      UPDATE meetings.meetings 
      SET status = 'leaving', updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING *
    `, [botId]);
    
    if (updateResult.rows.length === 0) {
      console.log(`No bot found with ID ${botId}`);
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    console.log(`Bot ${botId} status updated to leaving`);
    
    // Here you would typically call the Recall API to actually leave the meeting
    // For now, we'll just simulate it by updating the status after a delay
    setTimeout(async () => {
      try {
        await req.db.query(`
          UPDATE meetings.meetings 
          SET status = 'inactive', updated_at = NOW()
          WHERE recall_bot_id = $1
        `, [botId]);
        console.log(`Bot ${botId} status updated to inactive`);
      } catch (error) {
        console.error('Error updating bot status to inactive:', error);
      }
    }, 2000); // Simulate delay
    
    res.json({ success: true, message: 'Bot is leaving the meeting' });
  } catch (error) {
    console.error('Error leaving bot:', error);
    res.status(500).json({ error: 'Failed to leave bot' });
  }
});

export default router;