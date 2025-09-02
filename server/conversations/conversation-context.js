import { SimilarContentFinder } from './similar-content-finder.js';
import { ContextBuilder } from './context-builder.js';
import { ClientInfoFetcher } from './client-info-fetcher.js';
import { findSimilarChunks } from './conversation-context/chunk-finder.js';

/**
 * Build conversation context from similar turns and file chunks
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {Object} options.userTurn - User turn object
 * @param {string} options.clientId - Client ID
 * @returns {Promise<Object>} Context and sources
 */
export async function buildConversationContext({ req, userTurn, clientId }) {
  // Get parent client ID from session for mini-horde support
  const parentClientId = req.session?.parent_client_id || null;
  
  console.log('🔍 Building conversation context for turn:', userTurn.id, 'client:', clientId, 'parent:', parentClientId);
  
  // Find similar content
  const similarTurns = await SimilarContentFinder.findSimilarTurns(req, userTurn.id, parentClientId);
  const similarChunks = await SimilarContentFinder.findSimilarChunks(req, userTurn, clientId, parentClientId);
  
  // Build final context
  const { conversationContext, allSources } = ContextBuilder.buildFinalContext(similarTurns, similarChunks, clientId);
  
  // Log statistics
  ContextBuilder.logContextStats(conversationContext, allSources);
  
  return { context: conversationContext, sources: allSources };
}

/**
 * Get client information for context
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {string} options.userId - User ID
 * @returns {Promise<Object>} Client info with ID and name
 */
export async function getClientInfo({ req, userId }) {
  try {
    // Get info from session first
    const { clientId, clientName: sessionName } = ClientInfoFetcher.getClientInfoFromSession(req);
    
    // Try to fetch name from database if missing
    const dbName = await ClientInfoFetcher.fetchClientNameFromDb(req, clientId);
    const clientName = dbName || sessionName;
    
    return { clientId, clientName };
    
  } catch (error) {
    console.error('Error fetching client info:', error);
    return { clientId: null, clientName: 'your organization' };
  }
}

// Re-export for backward compatibility
export { findSimilarChunks };