import { findSimilarTurns } from './turn-compatibility.js';
import { findSimilarChunks } from './conversation-context/chunk-finder.js';
import { 
  formatPastDiscussions, 
  formatFileChunks, 
  formatSourceReferences 
} from './conversation-context/context-formatter.js';

// Build conversation context from similar turns and file chunks
export async function buildConversationContext(req, userTurn, clientId) {
  let conversationContext = '';
  const allSources = [];
  
  // Get parent client ID from session for mini-horde support
  const parentClientId = req.session?.parent_client_id || null;
  
  console.log('🔍 Building conversation context for turn:', userTurn.id, 'client:', clientId, 'parent:', parentClientId);
  
  try {
    // Use embedding similarity to find relevant past discussions
    let similarTurns = [];
    try {
      // Note: userTurn.id is the UUID, not turn_id
      similarTurns = await findSimilarTurns(
        req,
        userTurn.id, 
        10, // limit to 10 most similar turns
        0.7, // minimum similarity threshold
        parentClientId // include parent client data for mini-hordes
      );
      console.log('🔍 findSimilarTurns returned:', similarTurns?.length || 0, 'results');
    } catch (error) {
      console.warn('Error finding similar turns:', error.message, error.stack);
    }
    
    // Also find relevant file chunks if we have access to embedding service
    let similarChunks = [];
    if (req.turnProcessor && req.turnProcessor.embeddingService && clientId) {
      console.log('🔍 Looking for similar file chunks for client:', clientId);
      try {
        similarChunks = await findSimilarChunks(
          req.pool, 
          req.turnProcessor.embeddingService, 
          userTurn.content, 
          clientId,
          5, // limit to 5 most similar chunks
          0.6, // minimum similarity threshold
          parentClientId // include parent client data for mini-hordes
        );
        console.log('🔍 findSimilarChunks returned:', similarChunks?.length || 0, 'results');
      } catch (error) {
        console.warn('Error finding similar chunks:', error.message, error.stack);
      }
    } else {
      console.log('🔍 Skipping chunk search - missing requirements:', {
        hasTurnProcessor: !!req.turnProcessor,
        hasEmbeddingService: !!(req.turnProcessor?.embeddingService),
        hasClientId: !!clientId
      });
    }
    
    // Format past discussions
    const discussionResult = formatPastDiscussions(similarTurns, clientId);
    conversationContext += discussionResult.context;
    allSources.push(...discussionResult.sources);
    
    // Format file chunks
    const chunkResult = formatFileChunks(similarChunks, discussionResult.nextIndex);
    conversationContext += chunkResult.context;
    allSources.push(...chunkResult.sources);
    
    // Add source reference guide
    conversationContext += formatSourceReferences(allSources);
    
  } catch (error) {
    console.error('Error getting conversation context:', error);
  }
  
  console.log('🔍 Final conversation context length:', conversationContext.length, 'characters');
  console.log('🔍 Total sources found:', allSources.length);
  if (conversationContext.length > 0) {
    console.log('🔍 Context preview:', conversationContext.substring(0, 200) + '...');
  }
  
  return { context: conversationContext, sources: allSources };
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

// Re-export for backward compatibility
export { findSimilarChunks };