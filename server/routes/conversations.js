import express from 'express';
import { buildConversationContext, getClientInfo } from '../lib/conversation-context.js';
import { 
  validateAndGetUserId, 
  validateContent
} from '../lib/conversations/session-validator.js';
import { createUserTurn, createLLMTurn } from '../lib/conversations/turn-handler.js';
import { generateLLMResponse } from '../lib/conversations/llm-handler.js';
import { gameStateAgent } from '../../lib/game-state-agent.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

// Conversational REPL endpoint
router.post('/conversational-turn', async (req, res) => {
  console.log('🔍 START: Conversational turn request received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Session ID:', req.sessionID);
  console.log('Session meeting_id:', req.session?.meeting_id);
  console.log('Request meeting_id:', req.body?.meeting_id);
  
  try {
    const { content, context, meeting_id } = req.body;
    console.log('🔍 STEP 1: Extracted content, context, and meeting_id');
    
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

    // Validate meeting_id
    if (!meeting_id) {
      const ednError = `{:response-type :error :content "Meeting ID is required"}`;
      return res.status(400).send(ednError);
    }
    
    console.log('🔍 Using meeting_id from request:', meeting_id);
    console.log('🔍 STEP 4: About to create user turn - no session meeting creation');
    console.log('🔍 STEP 4a: meeting_id variable is:', meeting_id);
    console.log('🔍 STEP 4b: req.session?.meeting_id is:', req.session?.meeting_id);
    
    // Create user turn
    const userTurn = await createUserTurn(req, {
      userId: user_id,
      content: content,
      meetingId: meeting_id
    });
    
    // Get client info from meeting
    console.log('🔍 STEP 6: Getting client info from meeting:', meeting_id);
    let clientId = null;
    let clientName = 'your organization';
    
    try {
      const meetingResult = await req.pool.query(
        'SELECT client_id FROM meetings.meetings WHERE id = $1',
        [meeting_id]
      );
      
      if (meetingResult.rows.length > 0) {
        clientId = meetingResult.rows[0].client_id;
        
        // Get client name if we have a client ID
        if (clientId) {
          const clientResult = await req.pool.query(
            'SELECT name FROM client_mgmt.clients WHERE id = $1',
            [clientId]
          );
          
          if (clientResult.rows.length > 0) {
            clientName = clientResult.rows[0].name;
          }
        }
      }
    } catch (error) {
      console.warn('Could not get client info from meeting:', error.message);
      // Fall back to session-based client info
      const fallbackInfo = await getClientInfo(req, user_id);
      clientId = fallbackInfo.clientId;
      clientName = fallbackInfo.clientName;
    }
    
    console.log('🔍 STEP 6a: Client info retrieved:', { clientId, clientName });
    
    // Build conversation context
    console.log('🔍 STEP 7: Building conversation context');
    const contextResult = await buildConversationContext(req, userTurn, clientId);
    const conversationContext = contextResult.context || contextResult; // Handle both old and new formats
    const sources = contextResult.sources || [];
    console.log('🔍 STEP 7a: Conversation context built, length:', conversationContext?.length || 0);
    console.log('🔍 STEP 7b: Sources found:', sources.length);
    
    // Check game state
    console.log('🔍 STEP 8: Checking game state');
    const gameStateResult = await gameStateAgent.processTurn(req.sessionID, content, clientId);
    console.log('🔍 STEP 8a: Game state result:', gameStateResult);
    
    // Generate LLM response and get avatar info
    const llmResponseResult = await generateLLMResponse(req, {
      clientName,
      conversationContext,
      content,
      context,
      gameState: gameStateResult,
      clientId,
      userId: user_id
    });
    
    // Get the avatar that was used for this response
    const { selectAvatar, updateUserLastAvatar } = await import('../lib/avatar-operations.js');
    const usedAvatar = await selectAvatar(req.pool, { 
      clientId, 
      userId: user_id, 
      context: 'general' 
    });
    
    // Update user's last used avatar
    if (user_id && usedAvatar) {
      await updateUserLastAvatar(req.pool, user_id, usedAvatar.id);
    }
    
    // Create LLM turn
    const llmTurn = await createLLMTurn(req, {
      userId: user_id,
      llmResponse: llmResponseResult,
      userTurn,
      meetingId: meeting_id,
      avatarId: usedAvatar.id
    });
    
    res.json({
      id: llmTurn.id,
      user_turn_id: userTurn.id,
      prompt: content,
      response: llmResponseResult,
      sources: sources,
      created_at: llmTurn.created_at
    });
  } catch (error) {
    console.error('Conversational REPL error:', error);
    
    // Log error to database using centralized logging
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logError('conversation_error', error, {
        userId: req.session?.user?.user_id || req.session?.user?.id,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        severity: 'error',
        component: 'Conversations'
      });
      await dbAgent.close();
    } catch (logError) {
      console.error('Failed to log conversation error:', logError);
    }
    
    // Return EDN-formatted error for frontend parser
    const ednError = `{:response-type :error :content "Failed to process conversational turn: ${error.message.replace(/"/g, '\\"')}"}`;
    res.status(500).send(ednError);
  }
});

export default router;