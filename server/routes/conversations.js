import express from 'express';
import { buildConversationContext, getClientInfo } from '../lib/conversation-context.js';
import { extractRequestContext } from '../lib/event-logger.js';
import { 
  validateAndGetUserId, 
  validateContent, 
  ensureMeetingExists 
} from '../lib/conversations/session-validator.js';
import { createUserTurn, createLLMTurn } from '../lib/conversations/turn-handler.js';
import { generateLLMResponse } from '../lib/conversations/llm-handler.js';

const router = express.Router();

// Conversational REPL endpoint
router.post('/conversational-turn', async (req, res) => {
  console.log('🔍 START: Conversational turn request received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Session ID:', req.sessionID);
  
  try {
    const { content, context } = req.body;
    console.log('🔍 STEP 1: Extracted content and context');
    
    // Validate user authentication
    const user_id = await validateAndGetUserId(req);
    if (!user_id) {
      const ednError = `{:response-type :error :content "Authentication required"}`;
      return res.status(401).send(ednError);
    }
    
    // Validate content
    if (!await validateContent(content)) {
      const ednError = `{:response-type :error :content "Content is required"}`;
      return res.status(400).send(ednError);
    }

    // Ensure meeting exists
    const meeting_id = await ensureMeetingExists(req, req.db);
    
    // Create user turn
    const userTurn = await createUserTurn(req, {
      userId: user_id,
      content: content,
      meetingId: meeting_id
    });
    
    // Get client info for context
    console.log('🔍 STEP 6: Getting client info for user:', user_id);
    const { clientId, clientName } = await getClientInfo(req, user_id);
    console.log('🔍 STEP 6a: Client info retrieved:', { clientId, clientName });
    
    // Build conversation context
    console.log('🔍 STEP 7: Building conversation context');
    const conversationContext = await buildConversationContext(req, userTurn, clientId);
    console.log('🔍 STEP 7a: Conversation context built, length:', conversationContext?.length || 0);
    
    // Generate LLM response
    const llmResponse = await generateLLMResponse(req, {
      clientName,
      conversationContext,
      content,
      context
    });
    
    // Create LLM turn
    const llmTurn = await createLLMTurn(req, {
      userId: user_id,
      llmResponse,
      userTurn,
      meetingId: meeting_id
    });
    
    res.json({
      id: llmTurn.id,
      user_turn_id: userTurn.id,
      prompt: content,
      response: llmResponse,
      created_at: llmTurn.created_at
    });
  } catch (error) {
    console.error('Conversational REPL error:', error);
    
    // Log error to database
    const context = extractRequestContext(req);
    req.logger?.logError('conversation_error', error, context);
    
    // Return EDN-formatted error for frontend parser
    const ednError = `{:response-type :error :content "Failed to process conversational turn: ${error.message.replace(/"/g, '\\"')}"}`;
    res.status(500).send(ednError);
  }
});

export default router;