import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

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
    let meetingResult = await req.db.query(
      'SELECT meeting_id FROM meetings.meetings WHERE name = $1 AND meeting_type = $2',
      [`${platform} Session ${sessionId}`, 'browser_conversation']
    );

    let meetingId;
    if (meetingResult.rows.length === 0) {
      // Create new meeting for this browser session
      const newMeetingId = uuidv4();
      await req.db.query(`
        INSERT INTO meetings.meetings (meeting_id, name, description, meeting_type, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        newMeetingId,
        `${platform} Session ${sessionId}`,
        `Browser conversation session on ${platform} started at ${new Date().toISOString()}`,
        'browser_conversation',
        JSON.stringify({ 
          sessionId, 
          platform, 
          url, 
          ...metadata 
        })
      ]);
      meetingId = newMeetingId;
      console.log(`✅ Created new browser session meeting: ${meetingId}`);
    } else {
      meetingId = meetingResult.rows[0].meeting_id;
    }

    // Create turns for user prompt and AI response
    const userTurnId = uuidv4();
    const aiTurnId = uuidv4();
    
    // Insert user turn
    await req.db.query(`
      INSERT INTO meetings.turns (turn_id, content, source_type, metadata, timestamp, meeting_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      userTurnId, 
      userPrompt, 
      'user_input', 
      JSON.stringify({ sessionId, platform, url }),
      timestamp || new Date().toISOString(),
      meetingId
    ]);

    // Insert AI turn with slightly later timestamp to ensure ordering
    const aiTimestamp = timestamp ? new Date(timestamp).getTime() + 1 : Date.now() + 1;
    await req.db.query(`
      INSERT INTO meetings.turns (turn_id, content, source_type, metadata, timestamp, meeting_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      aiTurnId, 
      responseContent, 
      `${platform}_response`, 
      JSON.stringify({ sessionId, platform, url, ...metadata }),
      new Date(aiTimestamp).toISOString(),
      meetingId
    ]);

    console.log(`✅ Captured browser conversation: ${platform} session ${sessionId}`);
    
    res.json({ 
      success: true, 
      meetingId,
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