import express from 'express';
import { WebhookService } from '../services/webhook-service.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

// Chat webhook endpoint - handles incoming chat messages from Recall.ai
router.post('/webhook/chat', async (req, res) => {
  try {
    console.log('💬 Received chat webhook:', JSON.stringify(req.body, null, 2));
    
    const webhookService = new WebhookService(req.db, req.anthropic, req.fileUploadService);
    
    // Extract and validate webhook data
    const { botId, messageText, senderName } = webhookService.extractWebhookData(req.body);
    console.log(`💬 Chat message from bot ${botId}: "${messageText}"`);
    
    // Find the meeting for this bot
    const meeting = await webhookService.findMeetingByBot(botId);
    const meetingId = meeting.id;
    
    // Check if message is from Cogito (prevent loops)
    const commandCheck = webhookService.isCommandMessage(messageText, senderName);
    if (commandCheck.isLoop) {
      console.log('🔄 Ignoring message from Cogito to prevent loop');
      return res.json({ success: true, message: 'Ignoring bot message' });
    }
    
    // Append chat message to conversation timeline
    const chatEntry = `[${senderName} via chat] ${messageText}\n`;
    await req.appendToConversation(meetingId, chatEntry);
    console.log(`📝 Appended chat message from ${senderName}`);
    
    // Process commands (questions or direct messages to Cogito)
    if (commandCheck.isCommand) {
      console.log('❓ Question/Direct message detected - generating response');
      
      const response = await generateResponse(
        webhookService, 
        meeting, 
        messageText, 
        commandCheck,
        req.anthropic
      );
      
      console.log(`🤖 Generated response: "${response}"`);
      
      // Send response back to meeting chat via Recall.ai API
      await sendChatResponse(botId, response, meetingId, req.appendToConversation);
      
      return res.json({ 
        success: true, 
        message: 'Question processed',
        response: response
      });
    }
    
    // For other chat messages, just log them
    console.log(`💬 Chat message (not a command): "${messageText}"`);
    res.json({ success: true, message: 'Chat message received' });
    
  } catch (error) {
    console.error('❌ Error processing chat webhook:', error);
    
    // Log error to database using centralized logging
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logError('webhook_chat_error', error, {
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        botId: req.body?.data?.bot_id,
        severity: 'error',
        component: 'WebhookChat'
      });
      await dbAgent.close();
    } catch (logError) {
      console.error('Failed to log webhook chat error:', logError);
    }
    
    if (error.message.includes('No data') || error.message.includes('Missing message')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('No meeting found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to process chat webhook' });
  }
});

// Generate AI response based on message type
async function generateResponse(webhookService, meeting, messageText, commandCheck, anthropic) {
  const { hasContent, conversationText } = await webhookService.getConversationContext(meeting.id);
  
  if (!hasContent) {
    return commandCheck.isQuestion 
      ? "I haven't captured any content yet - are you speaking into the microphone?"
      : "I haven't captured much conversation content yet. Please continue the meeting and I'll be able to provide better responses.";
  }
  
  if (!anthropic || !process.env.ANTHROPIC_API_KEY) {
    return commandCheck.isQuestion 
      ? `I'm listening to your conversation but Claude AI is not available for analysis.`
      : `I heard your question. I have conversation data but Claude AI is not available to analyze it.`;
  }
  
  try {
    if (commandCheck.isDirectedAtCogito) {
      return await generateDirectedResponse(webhookService, meeting, messageText, conversationText, anthropic);
    } else {
      return await generateSummaryResponse(webhookService, meeting, conversationText, anthropic);
    }
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    return commandCheck.isQuestion 
      ? "I'm listening to your conversation but having trouble analyzing it right now. Please continue and try again."
      : `I heard your question but I'm having trouble analyzing the conversation right now.`;
  }
}

// Generate response for directed questions
async function generateDirectedResponse(webhookService, meeting, messageText, conversationText, anthropic) {
  // Extract the actual question after "cogito"
  const questionMatch = messageText.match(/cogito[,:]?\s*(.+)/i);
  const question = questionMatch ? questionMatch[1].trim() : messageText;
  
  // Get relevant file content
  const clientId = meeting.client_id || 6; // Default to cogito client
  const relevantFileContent = await webhookService.getRelevantFileContent(meeting.id, question, clientId);
  
  const prompt = `You are Cogito, an AI assistant helping with this meeting. You have access to the conversation transcript and any relevant uploaded documents, but you can also use your general knowledge to be helpful.

CONVERSATION TRANSCRIPT:
${conversationText}${relevantFileContent}

PARTICIPANT'S QUESTION: "${question}"

Please provide a helpful response that:
- First considers the meeting content and uploaded documents if relevant to the question
- Can draw on your general knowledge when appropriate to give comprehensive answers
- Is conversational and engaging (not limited to just meeting content)
- Can discuss topics beyond what's been covered in the meeting if that would be helpful
- Provides practical insights and actionable information when possible

Be thorough in your response while remaining clear and conversational. If the question relates to people mentioned in the meeting, reference the transcript context, but don't limit yourself only to meeting content if broader knowledge would be valuable.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }]
  });
  
  return message.content[0].text;
}

// Generate summary response for '?' command
async function generateSummaryResponse(webhookService, meeting, conversationText, anthropic) {
  // Get uploaded files context
  const uploadedFilesContext = await webhookService.getUploadedFilesContext(meeting.id);
  
  const prompt = `You are Cogito, an AI assistant providing a meeting status update. Analyze the conversation and provide insights.

CONVERSATION TRANSCRIPT:
${conversationText}${uploadedFilesContext}

Please provide a helpful status update that includes:
- Current discussion topics and themes
- Key insights or decisions that have emerged
- Notable participant contributions or perspectives
- Any patterns, tensions, or opportunities you observe
- Suggestions for productive next steps if appropriate

Be insightful and analytical while remaining conversational. You can offer observations that go beyond just summarizing what was said - provide value through your analysis of the conversation dynamics and content. If the conversation is light or just starting, acknowledge that and offer to help in other ways.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  });
  
  return message.content[0].text;
}

// Send response back to meeting chat
async function sendChatResponse(botId, response, meetingId, appendToConversation) {
  try {
    console.log('📤 Sending response to meeting chat:', response);
    
    const chatResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/send_chat_message/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: response
      })
    });
    
    if (chatResponse.ok) {
      console.log('✅ Chat response sent successfully');
      
      // Append Cogito's response to the conversation timeline
      const cogitoEntry = `[Cogito via chat] ${response}\n`;
      await appendToConversation(meetingId, cogitoEntry);
      console.log('📝 Appended Cogito response to timeline');
    } else {
      const errorText = await chatResponse.text();
      console.error('❌ Failed to send chat response:', chatResponse.status, errorText);
    }
  } catch (chatError) {
    console.error('❌ Error sending chat response:', chatError);
  }
}

export default router;