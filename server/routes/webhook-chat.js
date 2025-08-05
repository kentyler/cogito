import express from 'express';
import { WebhookService } from '../services/webhook-service.js';

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
  
  const prompt = `You are Cogito, an AI meeting assistant listening to a live meeting. You have access to the conversation transcript and any relevant uploaded documents.

CONVERSATION TRANSCRIPT:
${conversationText}${relevantFileContent}

PARTICIPANT'S QUESTION: "${question}"

Please provide a helpful, contextual response based on the meeting content and any relevant documents. Be concise (2-3 sentences max) and specific to what's been discussed. If the question asks about people, refer to the transcript for context about who they are and what they've said.`;

  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }]
  });
  
  return message.content[0].text;
}

// Generate summary response for '?' command
async function generateSummaryResponse(webhookService, meeting, conversationText, anthropic) {
  // Get uploaded files context
  const uploadedFilesContext = await webhookService.getUploadedFilesContext(meeting.id);
  
  const prompt = `You are Cogito, an AI meeting assistant. Provide a brief status update about this live meeting.

CONVERSATION TRANSCRIPT:
${conversationText}${uploadedFilesContext}

Please provide a concise 2-3 sentence summary that includes:
- How many speakers are active
- What the current discussion topic seems to be about
- Any key points or themes emerging

Keep it brief and focused on what's happening right now in the meeting.`;

  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 200,
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