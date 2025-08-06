import express from 'express';
import { createTurn } from '../lib/turn-compatibility.js';
import { buildConversationContext, getClientInfo } from '../lib/conversation-context.js';
import { buildConversationalPrompt, processLLMResponse } from '../lib/llm-prompt-builder.js';
import { createSessionMeeting } from '../lib/session-meeting.js';

const router = express.Router();

// Conversational REPL endpoint
router.post('/conversational-turn', async (req, res) => {
  console.log('🔍 START: Conversational turn request received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Session ID:', req.sessionID);
  
  try {
    const { content, context } = req.body;
    console.log('🔍 STEP 1: Extracted content and context');
    
    // Development mode: use a default user if no session
    let user_id;
    console.log('🔍 STEP 2: Checking authentication');
    if (req.session && req.session.user) {
      user_id = req.session.user.user_id;
      console.log('🔍 STEP 2a: Found authenticated user:', user_id);
    } else if (process.env.NODE_ENV !== 'production') {
      // Default to user 1 (ken@8thfold.com) in development
      user_id = 1;
      console.log('🔍 STEP 2b: Development mode: Using default user_id=1');
    } else {
      console.log('🔍 STEP 2c: No authentication found');
      // Return EDN-formatted error for frontend parser
      const ednError = `{:response-type :error :content "Authentication required"}`;
      return res.status(401).send(ednError);
    }
    
    if (!content) {
      console.log('🔍 STEP 3: No content provided');
      // Return EDN-formatted error for frontend parser
      const ednError = `{:response-type :error :content "Content is required"}`;
      return res.status(400).send(ednError);
    }
    console.log('🔍 STEP 3: Content validation passed');

    // Get meeting_id from session (created during login/client selection)
    let meeting_id = req.session?.meeting_id;
    
    // Debug logging to diagnose the issue
    console.log('Session data:', {
      sessionId: req.sessionID,
      meeting_id: meeting_id,
      user: req.session?.user
    });
    
    // Validate that meeting_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!meeting_id || !uuidRegex.test(meeting_id)) {
      // No meeting_id or invalid format - create a new session meeting
      console.log('Creating new session meeting due to missing or invalid meeting_id:', meeting_id);
      
      // Get client_id from session user or use default
      const client_id = req.session?.user?.client_id || 1;
      
      try {
        meeting_id = await createSessionMeeting(req.db, user_id, client_id);
        req.session.meeting_id = meeting_id;
        
        // Save session with new meeting_id
        await new Promise((resolve, reject) => {
          req.session.save(err => err ? reject(err) : resolve());
        });
        
        console.log('Created new session meeting:', meeting_id);
      } catch (error) {
        console.error('Failed to create session meeting:', error);
        const ednError = `{:response-type :error :content "Failed to create session meeting. Please try refreshing the page."}`;
        return res.status(500).send(ednError);
      }
    }
    
    // Store the user's prompt as a turn with embedding
    console.log('🔍 STEP 5: Creating user turn with meeting_id:', meeting_id);
    let userTurn;
    try {
      userTurn = await createTurn(req, {
        user_id: user_id,
        content: content,
        source_type: 'conversational-repl-user',
        metadata: {},
        meeting_id: meeting_id
      });
      console.log('🔍 STEP 5a: User turn created successfully:', userTurn.id);
    } catch (error) {
      console.error('🔍 STEP 5b: Failed to create user turn:', error);
      throw error;
    }
    // Get the current user's client_id to filter discussions
    console.log('🔍 STEP 6: Getting client info for user:', user_id);
    const { clientId, clientName } = await getClientInfo(req, user_id);
    console.log('🔍 STEP 6a: Client info retrieved:', { clientId, clientName });
    
    // Get semantically similar conversation history for context
    console.log('🔍 STEP 7: Building conversation context');
    const conversationContext = await buildConversationContext(req, userTurn, clientId);
    console.log('🔍 STEP 7a: Conversation context built, length:', conversationContext?.length || 0);
    // Generate LLM response
    let llmResponse;
    try {
      if (req.anthropic) {
        const prompt = buildConversationalPrompt(clientName, conversationContext, content, context);

        const message = await req.anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        });
        
        llmResponse = processLLMResponse(message.content[0].text);
        
      } else {
        llmResponse = `{:response-type :text :content "Claude not available - check ANTHROPIC_API_KEY"}`;
      }
    } catch (llmError) {
      console.error('LLM Error:', llmError);
      llmResponse = `{:response-type :text :content "Error generating response: ${llmError.message}"}`;
    }
    
    // Check if this is a response-set (multiple alternatives)
    let llmTurn;
    if (llmResponse.includes(':response-set')) {
      // Parse the response to extract alternatives
      try {
        // For now, store the complete response-set as a single turn
        // The frontend will handle parsing and navigation
        llmTurn = await createTurn(req, {
          user_id: user_id,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_id: userTurn.id,
          meeting_id: meeting_id,
          metadata: { 
            user_turn_id: userTurn.id,
            response_type: 'response-set',
            has_alternatives: true
          }
        });
      } catch (parseError) {
        console.error('Error storing response-set:', parseError);
        // Fallback to single response
        llmTurn = await createTurn(req, {
          user_id: user_id,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_id: userTurn.id,
          meeting_id: meeting_id,
          metadata: { 
            user_turn_id: userTurn.id,
            response_type: 'clojure-data'
          }
        });
      }
    } else {
      // Store single response as before
      llmTurn = await createTurn(req, {
        user_id: user_id,
        content: llmResponse,
        source_type: 'conversational-repl-llm',
        source_id: userTurn.id,
        meeting_id: meeting_id,
        metadata: { 
          user_turn_id: userTurn.id,
          response_type: 'clojure-data'
        }
      });
    }
    
    res.json({
      id: llmTurn.id,
      user_turn_id: userTurn.id,
      prompt: content,
      response: llmResponse,
      created_at: llmTurn.created_at
    });
  } catch (error) {
    console.error('Conversational REPL error:', error);
    // Return EDN-formatted error for frontend parser
    const ednError = `{:response-type :error :content "Failed to process conversational turn: ${error.message.replace(/"/g, '\\"')}"}`;
    res.status(500).send(ednError);
  }
});

export default router;