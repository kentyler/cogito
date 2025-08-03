import { findSimilarTurns } from './turn-compatibility.js';

// Build conversation context from similar turns
export async function buildConversationContext(req, userTurn, clientId) {
  let conversationContext = '';
  
  try {
    // Use embedding similarity to find relevant past discussions
    const similarTurns = await findSimilarTurns(
      req,
      userTurn.turn_id, 
      10, // limit to 10 most similar turns
      0.7 // minimum similarity threshold
    );
    
    if (similarTurns && similarTurns.length > 0) {
      // Filter by client_id if available
      const clientFilteredTurns = clientId 
        ? similarTurns.filter(turn => turn.client_id === clientId)
        : similarTurns;
      
      if (clientFilteredTurns.length > 0) {
        conversationContext = `\n\n--- Relevant past discussions ---\n`;
        clientFilteredTurns.forEach((turn, index) => {
          conversationContext += `${index + 1}. ${turn.content}\n`;
          if (turn.response_content) {
            conversationContext += `   Response: ${turn.response_content}\n`;
          }
        });
        conversationContext += `--- End context ---\n\n`;
        
        console.log(`📚 Found ${clientFilteredTurns.length} relevant past discussions for context`);
      } else {
        console.log(`📚 Found ${similarTurns.length} similar turns but none for client ${clientId}`);
      }
    } else {
      console.log('📚 No similar past discussions found for context');
    }
  } catch (error) {
    console.error('Error getting conversation context:', error);
  }
  
  return conversationContext;
}

// Get client information for context
export async function getClientInfo(req, user_id) {
  let clientId = null;
  let clientName = 'your organization';
  
  try {
    if (req.session && req.session.user) {
      clientId = req.session.user.client_id;
      clientName = req.session.user.client_name || clientName;
    }
    
    // If we have a pool/db but no client name, try to fetch it
    const pool = req.pool || req.db;
    if (clientId && pool && !req.session?.user?.client_name) {
      try {
        const clientResult = await pool.query(
          'SELECT name as client_name FROM client_mgmt.clients WHERE id = $1',
          [clientId]
        );
        
        if (clientResult.rows.length > 0) {
          clientName = clientResult.rows[0].client_name;
        }
      } catch (e) {
        console.log('Could not fetch client name:', e.message);
      }
    }
  } catch (error) {
    console.error('Error fetching client info:', error);
  }
  
  return { clientId, clientName };
}