import { findSimilarTurns } from './turn-compatibility.js';

// Find similar file chunks using embedding similarity
async function findSimilarChunks(pool, embeddingService, content, clientId, limit = 5, minSimilarity = 0.6) {
  try {
    // Generate embedding for the user's content
    const queryEmbedding = await embeddingService.generateEmbedding(content);
    const embeddingString = embeddingService.formatForDatabase(queryEmbedding);
    
    const query = `
      SELECT 
        c.content,
        f.filename,
        f.source_type,
        1 - (c.embedding_vector <=> $1) as similarity
      FROM context.chunks c
      JOIN context.files f ON c.file_id = f.id
      WHERE c.client_id = $2
      AND c.embedding_vector IS NOT NULL
      AND 1 - (c.embedding_vector <=> $1) >= $3
      ORDER BY similarity DESC
      LIMIT $4
    `;
    
    const result = await pool.query(query, [embeddingString, clientId, minSimilarity, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error finding similar chunks:', error);
    return [];
  }
}

// Build conversation context from similar turns and file chunks
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
    
    // Also find relevant file chunks if we have access to embedding service
    let similarChunks = [];
    if (req.turnProcessor && req.turnProcessor.embeddingService && clientId) {
      similarChunks = await findSimilarChunks(
        req.pool, 
        req.turnProcessor.embeddingService, 
        userTurn.content, 
        clientId,
        5, // limit to 5 most similar chunks
        0.6 // minimum similarity threshold
      );
    }
    
    // Build context from past discussions
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
        conversationContext += `--- End past discussions ---\n\n`;
        
        console.log(`📚 Found ${clientFilteredTurns.length} relevant past discussions for context`);
      } else {
        console.log(`📚 Found ${similarTurns.length} similar turns but none for client ${clientId}`);
      }
    } else {
      console.log('📚 No similar past discussions found for context');
    }
    
    // Add context from uploaded files
    if (similarChunks && similarChunks.length > 0) {
      conversationContext += `--- Relevant content from uploaded files ---\n`;
      similarChunks.forEach((chunk, index) => {
        conversationContext += `${index + 1}. From "${chunk.filename}": ${chunk.content}\n`;
      });
      conversationContext += `--- End file content ---\n\n`;
      
      console.log(`📄 Found ${similarChunks.length} relevant file chunks for context`);
    } else {
      console.log('📄 No relevant file chunks found for context');
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