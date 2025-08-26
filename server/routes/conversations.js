/**
 * Conversations Routes
 * Modular conversation handling with focused responsibilities
 */

import express from 'express';
import { processConversationalTurn } from './turn-orchestrator.js';
import { handleConversationError } from './error-handler.js';

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
    
    const result = await processConversationalTurn(req, {
      content,
      context, 
      meeting_id
    });
    
    res.json(result);
    
  } catch (error) {
    await handleConversationError(error, req, res);
  }
});

export default router;