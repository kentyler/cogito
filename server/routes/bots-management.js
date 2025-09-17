import { ApiResponses } from '#server/api/api-responses.js';
import express from 'express';
import { requireAuth } from './auth/middleware.js';
import { DatabaseAgent } from '#database/database-agent.js';

const router = express.Router();
const dbAgent = new DatabaseAgent();

// Get running bots endpoint
router.get('/bots', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user.user_id;
    
    // Ensure dbAgent is connected
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    
    const activeBots = await dbAgent.bots.getActiveBots();
    
    return ApiResponses.success(res, activeBots);
  } catch (error) {
    console.error('Error fetching bots:', error);
    return ApiResponses.error(res, 500, 'Failed to fetch bots');
  }
});

// Get stuck meetings endpoint
router.get('/stuck-meetings', requireAuth, async (req, res) => {
  try {
    console.log('Fetching stuck meetings...');
    
    // Ensure dbAgent is connected
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    
    const stuckMeetings = await dbAgent.bots.getStuckMeetings();
    
    console.log('Found stuck meetings:', stuckMeetings.length);
    return ApiResponses.success(res, stuckMeetings);
  } catch (error) {
    console.error('Error fetching stuck meetings:', error);
    return ApiResponses.error(res, 500, 'Failed to fetch stuck meetings');
  }
});

// Force complete stuck meeting endpoint
router.post('/stuck-meetings/:meetingId/complete', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Ensure dbAgent is connected
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    
    // Update the meeting status to completed using BotOperations
    const updatedMeeting = await dbAgent.bots.forceCompleteMeeting(meetingId);
    
    if (!updatedMeeting) {
      return ApiResponses.error(res, 404, 'Meeting not found');
    }
    
    res.json({ 
      success: true, 
      message: 'Meeting marked as completed',
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error('Error completing stuck meeting:', error);
    return ApiResponses.error(res, 500, 'Failed to complete meeting');
  }
});

// Shutdown bot endpoint
router.post('/bots/:botId/leave', requireAuth, async (req, res) => {
  try {
    const { botId } = req.params;
    const user_id = req.session.user.user_id || req.session.user.id;
    
    console.log(`Shutting down bot ${botId} for user ${user_id}`);
    
    // Ensure dbAgent is connected
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    
    // Update the bot status to leaving using BotOperations
    const updatedMeeting = await dbAgent.bots.setBotStatusLeaving(botId);
    
    if (!updatedMeeting) {
      console.log(`No bot found with ID ${botId}`);
      return ApiResponses.error(res, 404, 'Bot not found');
    }
    
    console.log(`Bot ${botId} status updated to leaving`);
    
    // Here you would typically call the Recall API to actually leave the meeting
    // For now, we'll just simulate it by updating the status after a delay
    setTimeout(async () => {
      try {
        await dbAgent.bots.setBotStatusInactive(botId);
        console.log(`Bot ${botId} status updated to inactive`);
      } catch (error) {
        console.error('Error updating bot status to inactive:', error);
      }
    }, 2000); // Simulate delay
    
    return ApiResponses.success(res, { success: true, message: 'Bot is leaving the meeting' });
  } catch (error) {
    console.error('Error leaving bot:', error);
    return ApiResponses.error(res, 500, 'Failed to leave bot');
  }
});

export default router;