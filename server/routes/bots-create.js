import { ApiResponses } from '#server/api/api-responses.js';
import express from 'express';
import { requireAuth } from './auth/middleware.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { createRecallBot, getWebsocketUrls } from '#server/meetings/bot-creation/recall-api.js';
import { createMeetingRecord, updateMeetingWithEmail } from '#server/meetings/bot-creation/meeting-handler.js';
import { processMeetingFiles } from '#server/meetings/bot-creation/file-processor.js';

const router = express.Router();

// Create bot endpoint - handles bot creation with Recall.ai
router.post('/create-bot', requireAuth, async (req, res) => {
  try {
    const { meeting_url, meeting_name } = req.body;
    const user_id = req.session.user.user_id;
    let client_id = req.session.user.client_id;
    
    if (!meeting_url) {
      return ApiResponses.error(res, 400, 'Meeting URL is required');
    }
    
    // If client_id is missing from session, use default client (temporary fix)
    if (!client_id) {
      console.log(`Client ID missing from session for user ${user_id}, using default client_id = 1`);
      client_id = 1; // Default to client 1 for now
    }
    
    console.log(`Creating bot for user ${user_id}, client ${client_id}, meeting: ${meeting_url}`);
    
    // Get WebSocket URLs
    const { websocketUrl, webhookUrl } = getWebsocketUrls();
    
    // Create bot with Recall.ai
    let botData;
    try {
      botData = await createRecallBot({ 
        meetingUrl: meeting_url, 
        websocketUrl, 
        webhookUrl 
      });
    } catch (error) {
      console.error('Failed to create Recall bot:', error);
      
      // Check for specific Recall.ai API errors
      if (error.message.includes('403')) {
        return res.status(503).json({ 
          error: 'Bot creation service temporarily unavailable', 
          details: 'The Recall.ai service is currently blocking requests. This may be due to rate limiting or service issues. Please try again later.',
          technicalDetails: error.message.substring(0, 200) 
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create bot', 
        details: error.message 
      });
    }
    
    console.log('Creating meeting record for bot:', botData.id);
    
    // Create meeting record
    const meeting = await createMeetingRecord(req.db, {
      meetingUrl: meeting_url,
      meetingName: meeting_name,
      userId: user_id,
      clientId: client_id,
      botId: botData.id
    });
    
    // Log successful meeting creation using centralized logging
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logEvent('meeting_created', {
        meeting_id: meeting.id,
        meeting_url: meeting_url,
        bot_id: botData.id,
        client_id: client_id,
        timestamp: new Date().toISOString()
      }, {
        userId: user_id,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        component: 'BotCreation'
      });
      await dbAgent.close();
    } catch (logError) {
      console.error('Failed to log meeting creation:', logError);
    }
    
    // Update meeting with transcript email
    const userEmail = req.session.user.email;
    await updateMeetingWithEmail({ db: req.db, meetingId: meeting.id, email: userEmail, userId: user_id });
    
    // Process uploaded files if any
    const uploadedFiles = await processMeetingFiles(req.files, {
      fileUploadService: req.fileUploadService,
      db: req.db,
      meetingId: meeting.id,
      meetingName: meeting_name,
      meetingUrl: meeting_url,
      clientId: client_id,
      userId: user_id
    });
    
    res.json({
      bot: botData,
      meeting: meeting,
      uploadedFiles: uploadedFiles
    });
  } catch (error) {
    console.error('Bot creation error:', error);
    console.error('Request body:', req.body);
    console.error('User session:', req.session?.user);
    
    // Log error to database using centralized logging
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logError('bot_creation_error', error, {
        userId: req.session?.user?.user_id || req.session?.user?.id,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        meeting_url: req.body?.meeting_url,
        severity: 'error',
        component: 'BotCreation'
      });
      await dbAgent.close();
    } catch (logError) {
      console.error('Failed to log bot creation error:', logError);
    }
    
    return ApiResponses.internalError(res, 'Failed to create bot', { details: error.message });
  }
});

export default router;