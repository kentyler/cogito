import { ApiResponses } from '#server/api/api-responses.js';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseAgent } from '#database/database-agent.js';

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
    console.error('Database connection error in browser-capture:', error);
    return ApiResponses.error(res, 500, 'Database connection failed');
  }
});

// Browser conversation capture endpoint
router.post('/capture-browser-conversation', async (req, res) => {
  try {
    const { 
      platform, 
      sessionId, 
      userPrompt, 
      aiResponse, 
      claudeResponse, // For backwards compatibility
      timestamp,
      url,
      metadata 
    } = req.body;

    // Normalize response field names
    const responseContent = aiResponse || claudeResponse;

    if (!sessionId || !userPrompt || !responseContent) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, userPrompt, and aiResponse/claudeResponse' 
      });
    }

    // Check if we already have a meeting for this session
    const meetingName = `${platform} Session ${sessionId}`;
    let meetingId;
    
    // Try to find existing meeting using domain operations
    const existingMeeting = await dbAgent.meetings.getMeetingByNameAndType(meetingName, 'browser_conversation');
    
    if (existingMeeting) {
      meetingId = existingMeeting.meeting_id;
    } else {
      // Create new meeting for this browser session using domain operations
      const meetingData = {
        name: meetingName,
        description: `Browser conversation session on ${platform} started at ${new Date().toISOString()}`,
        meeting_type: 'browser_conversation',
        metadata: { 
          sessionId, 
          platform, 
          url, 
          ...metadata 
        }
      };
      
      const newMeeting = await dbAgent.meetings.createMeeting(meetingData);
      meetingId = newMeeting.meeting_id;
      console.log(`✅ Created new browser session meeting: ${meetingId}`);
    }

    // Create turns for user prompt and AI response using turns domain
    const userTurnData = {
      content: userPrompt,
      source_type: 'user_input',
      metadata: { sessionId, platform, url },
      timestamp: timestamp || new Date().toISOString(),
      meeting_id: meetingId
    };
    
    const userTurn = await dbAgent.turns.createTurn(userTurnData);

    // Insert AI turn with slightly later timestamp to ensure ordering
    const aiTimestamp = timestamp ? new Date(timestamp).getTime() + 1 : Date.now() + 1;
    const aiTurnData = {
      content: responseContent,
      source_type: `${platform}_response`,
      metadata: { sessionId, platform, url, ...metadata },
      timestamp: new Date(aiTimestamp).toISOString(),
      meeting_id: meetingId
    };
    
    const aiTurn = await dbAgent.turns.createTurn(aiTurnData);

    console.log(`✅ Captured browser conversation: ${platform} session ${sessionId}`);
    
    res.json({ 
      success: true, 
      meetingId,
      userTurnId: userTurn.turn_id,
      aiTurnId: aiTurn.turn_id,
      message: 'Conversation captured successfully' 
    });

  } catch (error) {
    console.error('❌ Error capturing browser conversation:', error);
    res.status(500).json({ 
      error: 'Failed to capture conversation',
      details: error.message 
    });
  }
});

export default router;