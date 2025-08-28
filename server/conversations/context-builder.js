/**
 * Context Builder - Combines context sources and formats final output
 */

import { 
  formatPastDiscussions, 
  formatFileChunks, 
  formatSourceReferences 
} from './conversation-context/context-formatter.js';

export class ContextBuilder {
  /**
   * Build final context from similar turns and chunks
   */
  static buildFinalContext(similarTurns, similarChunks, clientId) {
    let conversationContext = '';
    const allSources = [];

    try {
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
      console.error('Error building final context:', error);
    }

    return { conversationContext, allSources };
  }

  /**
   * Log final context statistics
   */
  static logContextStats(conversationContext, allSources) {
    console.log('🔍 Final conversation context length:', conversationContext.length, 'characters');
    console.log('🔍 Total sources found:', allSources.length);
    
    if (conversationContext.length > 0) {
      console.log('🔍 Context preview:', conversationContext.substring(0, 200) + '...');
    }
  }
}