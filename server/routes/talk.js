/**
 * Talk Tab - Simple client-based turns without meetings
 * Uses new unified TurnProcessor for all turn operations
 */
import express from 'express';
import { TurnProcessor } from '../../lib/turn-processor.js';
import { generateLLMResponse } from '../conversations/llm-handler.js';

const router = express.Router();

/**
 * Get Talk turns for a client with pagination - ordered by turn_index
 */
router.get('/turns/:client_id', async (req, res) => {
  try {
    const { client_id } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const before_turn_id = req.query.before_turn_id; // For loading older turns
    
    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }
    
    const turnProcessor = new TurnProcessor();
    await turnProcessor._ensureConnection();
    
    try {
      let query, params;
      
      if (before_turn_id) {
        // Load older turns before a specific turn (for scroll-up)
        query = `
          SELECT t.*
          FROM meetings.turns t
          WHERE t.client_id = $1 AND t.meeting_id IS NULL
            AND t.turn_index < (
              SELECT turn_index FROM meetings.turns WHERE id = $2
            )
          ORDER BY t.turn_index DESC
          LIMIT $3
        `;
        params = [client_id, before_turn_id, limit];
      } else {
        // Load latest turns (default behavior)
        query = `
          SELECT t.*
          FROM meetings.turns t
          WHERE t.client_id = $1 AND t.meeting_id IS NULL
          ORDER BY t.turn_index DESC
          LIMIT $2
          OFFSET $3
        `;
        params = [client_id, limit, offset];
      }
      
      const result = await turnProcessor.dbAgent.connector.query(query, params);
      
      // Get total count for pagination info
      const countQuery = `
        SELECT COUNT(*) as total
        FROM meetings.turns t
        WHERE t.client_id = $1 AND t.meeting_id IS NULL
      `;
      const countResult = await turnProcessor.dbAgent.connector.query(countQuery, [client_id]);
      const total = parseInt(countResult.rows[0].total);
      
      // Reverse turns for chronological order (oldest first) if not using before_turn_id
      const turns = before_turn_id ? result.rows.reverse() : result.rows.reverse();
      
      res.json({
        success: true,
        turns: turns,
        pagination: {
          total: total,
          limit: limit,
          offset: offset,
          has_more: before_turn_id ? turns.length === limit : (offset + turns.length < total),
          count: turns.length
        }
      });
      
    } catch (error) {
      console.error('Error fetching talk turns:', error);
      res.status(500).json({ error: 'Failed to fetch turns' });
    }
    
  } catch (error) {
    console.error('Error in talk turns endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch turns' });
  }
});

/**
 * Create a simple turn for Talk tab using unified TurnProcessor
 */
router.post('/message', async (req, res) => {
  try {
    const { client_id, content, insertAfter, insertBefore } = req.body;
    const userId = req.session?.user?.user_id;
    
    if (!client_id || !content) {
      return res.status(400).json({ error: 'client_id and content are required' });
    }
    
    // Create turn processor instance
    const turnProcessor = new TurnProcessor();
    
    // Prepare turn data for unified processor
    const turnData = {
      meeting_id: null, // No meeting for Talk tab
      client_id: parseInt(client_id),
      user_id: userId,
      content: content.trim(),
      source_type: 'user',
      insertAfter, // Support for insertable ordering
      insertBefore,
      metadata: {
        source: 'talk_tab'
      }
    };
    
    console.log('🔍 Creating turn with TurnProcessor:', turnData);
    
    // Use unified TurnProcessor - handles everything:
    // - Addressing parsing (@mentions, /citations)
    // - Context retrieval (similar turns + file chunks)  
    // - turn_index calculation
    // - Embedding generation
    // - Notification creation
    const createdTurn = await turnProcessor.createTurn(turnData);
    
    console.log('✅ Turn created with full processing:', createdTurn.id);
    
    // Prepare response data with all the rich context
    let responseData = {
      success: true,
      turn: createdTurn,
      addressing: createdTurn.addressing,
      context: createdTurn.context,
      notifications: createdTurn.notifications,
      cogitoResponse: null
    };
    
    // If addressing indicates Cogito should respond, generate LLM response
    if (createdTurn.addressing?.shouldInvokeCogito) {
      try {
        console.log('🤖 Talk tab: Starting LLM response with context...');
        
        // Get formatted context for LLM
        const contextForLLM = await turnProcessor.getContextForLLM(createdTurn.id);
        
        const llmResponse = await generateLLMResponse(req, {
          clientName: 'Cogito',
          conversationContext: contextForLLM.context_summary,
          content: content.replace('@', '').trim(),
          context: contextForLLM.items, // Rich context from turns + files
          gameState: null,
          clientId: client_id,
          userId: userId
        });
        
        if (llmResponse && typeof llmResponse === 'string' && llmResponse.trim()) {
          // Create Cogito's response using same TurnProcessor
          const cogitoTurnData = {
            meeting_id: null,
            client_id: parseInt(client_id),
            user_id: null, // null indicates AI response
            content: llmResponse.trim(),
            source_type: 'response',
            metadata: {
              source: 'talk_tab_cogito_response',
              in_response_to: createdTurn.id,
              context_used: contextForLLM.total_items
            }
          };
          
          console.log('🤖 Talk tab: Creating Cogito response with TurnProcessor...');
          const responseTurn = await turnProcessor.createTurn(cogitoTurnData);
          
          responseData.cogitoResponse = {
            ...responseTurn,
            context_used: contextForLLM
          };
          
          console.log('🤖 Talk tab: Cogito response created with full processing:', responseTurn.id);
        }
      } catch (llmError) {
        console.error('❌ Error generating Talk tab LLM response:', llmError);
        // Still return success for the user turn
      }
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error creating talk message:', error);
    res.status(500).json({ 
      error: 'Failed to create message',
      details: error.message 
    });
  }
});

/**
 * Insert message between two existing turns
 */
router.post('/insert', async (req, res) => {
  try {
    const { client_id, content, after_turn_id, before_turn_id } = req.body;
    const userId = req.session?.user?.user_id;
    
    if (!client_id || !content || !after_turn_id) {
      return res.status(400).json({ 
        error: 'client_id, content, and after_turn_id are required' 
      });
    }
    
    const turnProcessor = new TurnProcessor();
    
    // Turn data with insertion parameters
    const turnData = {
      meeting_id: null,
      client_id: parseInt(client_id),
      user_id: userId,
      content: content.trim(),
      source_type: 'user',
      insertAfter: after_turn_id,
      insertBefore: before_turn_id, // Optional
      metadata: {
        source: 'talk_tab_insert',
        insertion_requested: true
      }
    };
    
    console.log('🔍 Inserting turn between messages:', turnData);
    const createdTurn = await turnProcessor.createTurn(turnData);
    
    res.json({
      success: true,
      turn: createdTurn,
      addressing: createdTurn.addressing,
      context: createdTurn.context,
      notifications: createdTurn.notifications,
      inserted_after: after_turn_id,
      inserted_before: before_turn_id
    });
    
  } catch (error) {
    console.error('Error inserting talk message:', error);
    res.status(500).json({ 
      error: 'Failed to insert message',
      details: error.message 
    });
  }
});

export default router;