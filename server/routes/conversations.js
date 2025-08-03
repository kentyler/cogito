import express from 'express';
import { createTurn } from '../lib/turn-compatibility.js';
import { buildConversationContext, getClientInfo } from '../lib/conversation-context.js';
import { buildConversationalPrompt, processLLMResponse } from '../lib/llm-prompt-builder.js';

const router = express.Router();

// Conversational REPL endpoint
router.post('/conversational-turn', async (req, res) => {
  try {
    const { content, context } = req.body;
    
    // Development mode: use a default user if no session
    let user_id;
    if (req.session && req.session.user) {
      user_id = req.session.user.user_id;
    } else if (process.env.NODE_ENV !== 'production') {
      // Default to user 1 (ken@8thfold.com) in development
      user_id = 1;
      console.log('Development mode: Using default user_id=1');
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get meeting_id from session (created during login/client selection)
    const meeting_id = req.session?.meeting_id;
    if (!meeting_id) {
      return res.status(400).json({ error: 'No active session meeting found' });
    }
    
    // Store the user's prompt as a turn with embedding
    const userTurn = await createTurn(req, {
      user_id: user_id,
      content: content,
      source_type: 'conversational-repl-user',
      metadata: {},
      meeting_id: meeting_id
    });
    // Get the current user's client_id to filter discussions
    const { clientId, clientName } = await getClientInfo(req, user_id);
    // Get semantically similar conversation history for context
    const conversationContext = await buildConversationContext(req, userTurn, clientId);
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
          source_turn_id: userTurn.turn_id,
          meeting_id: meeting_id,
          metadata: { 
            user_turn_id: userTurn.turn_id,
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
          source_turn_id: userTurn.turn_id,
          meeting_id: meeting_id,
          metadata: { 
            user_turn_id: userTurn.turn_id,
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
        source_turn_id: userTurn.turn_id,
        meeting_id: meeting_id,
        metadata: { 
          user_turn_id: userTurn.turn_id,
          response_type: 'clojure-data'
        }
      });
    }
    
    res.json({
      id: llmTurn.turn_id,
      user_turn_id: userTurn.turn_id,
      prompt: content,
      response: llmResponse,
      created_at: llmTurn.created_at
    });
  } catch (error) {
    console.error('Conversational REPL error:', error);
    res.status(500).json({ error: 'Failed to process conversational turn' });
  }
});

export default router;