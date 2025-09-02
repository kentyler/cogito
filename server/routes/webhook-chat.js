import { ApiResponses } from '#server/api/api-responses.js';
import express from 'express';
import { WebhookService } from '../services/webhook-service.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { generateDirectedResponse, generateSummaryResponse, sendChatResponse } from '#server/meetings/webhook-chat-helpers.js';

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
      return ApiResponses.success(res, { success: true, message: 'Ignoring bot message' });
    }
    
    // Append chat message to conversation timeline
    const chatEntry = `[${senderName} via chat] ${messageText}\n`;
    await req.appendToConversation(meetingId, chatEntry);
    console.log(`📝 Appended chat message from ${senderName}`);
    
    // Process commands (questions or direct messages to Cogito)
    if (commandCheck.isQuestion || commandCheck.isDirectedAtCogito) {
      console.log(`🔍 Processing as ${commandCheck.isDirectedAtCogito ? 'directed question' : 'general question'}`);
      
      const response = await generateResponse({
        webhookService,
        meeting,
        messageText,
        commandCheck,
        anthropic: req.anthropic
      });
      
      if (response) {
        // Send the response back to the meeting chat
        await sendChatResponse({
          botId,
          response,
          meetingId,
          appendToConversation: req.appendToConversation
        });
        console.log('✅ Question processed and response sent');
      }
      
      return ApiResponses.success(res, { 
        success: true, 
        message: 'Question processed',
        response: response
      });
    }
    
    // For other chat messages, just log them
    console.log(`💬 Chat message (not a command): "${messageText}"`);
    return ApiResponses.success(res, { success: true, message: 'Chat message received' });
    
  } catch (error) {
    console.error('❌ Error processing chat webhook:', error);
    
    // Log error to database using centralized logging
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logError('webhook_chat_error', error, {
        userId: req.session?.user?.user_id,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        severity: 'error',
        component: 'WebhookChat'
      });
      await dbAgent.close();
    } catch (logError) {
      console.error('Failed to log webhook chat error:', logError);
    }
    
    if (error.message.includes('No data') || error.message.includes('Missing message')) {
      return ApiResponses.error(res, 400, error.message);
    }
    if (error.message.includes('No meeting found')) {
      return ApiResponses.error(res, 404, error.message);
    }
    
    return ApiResponses.error(res, 500, 'Failed to process chat webhook');
  }
});

/**
 * Generate AI response based on message type
 * @param {Object} options
 * @param {Object} options.webhookService - Webhook service for conversation context
 * @param {Object} options.meeting - Meeting object with id
 * @param {string} options.messageText - The message text to process
 * @param {Object} options.commandCheck - Command check results (isQuestion, isDirectedAtCogito)
 * @param {Object} options.anthropic - Anthropic API client instance
 * @returns {Promise<string>} Generated response text
 */
async function generateResponse({ webhookService, meeting, messageText, commandCheck, anthropic }) {
  const { hasContent, conversationText } = await webhookService.getConversationContext(meeting.id);
  
  if (!hasContent) {
    return commandCheck.isQuestion 
      ? 'I haven\'t captured any content yet - are you speaking into the microphone?'
      : 'I haven\'t captured much conversation content yet. Please continue the meeting and I\'ll be able to provide better responses.';
  }
  
  if (!anthropic || !process.env.ANTHROPIC_API_KEY) {
    return commandCheck.isQuestion 
      ? `I'm listening to your conversation but Claude AI is not available for analysis.`
      : `I heard your question. I have conversation data but Claude AI is not available to analyze it.`;
  }
  
  try {
    if (commandCheck.isDirectedAtCogito) {
      return await generateDirectedResponse({ webhookService, meeting, messageText, conversationText, anthropic });
    } else {
      return await generateSummaryResponse({ webhookService, meeting, conversationText, anthropic });
    }
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    return commandCheck.isQuestion 
      ? 'I\'m listening to your conversation but having trouble analyzing it right now. Please continue and try again.'
      : `I heard your question but I'm having trouble analyzing the conversation right now.`;
  }
}

export default router;