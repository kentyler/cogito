/**
 * Quick search function for use during conversations
 */

import { conversationSearch } from './conversation-search.js';

export async function quickSearch(query, options = {}) {
  const {
    limit = 3,
    threshold = 0.3,
    includeContext = false,
    contextTurns = 2
  } = options;
  
  try {
    let results;
    
    if (includeContext) {
      results = await conversationSearch.searchWithContext(query, limit, contextTurns);
      return conversationSearch.formatResultsWithContext(results);
    } else {
      results = await conversationSearch.searchConversations(query, limit, threshold);
      return conversationSearch.formatResults(results);
    }
    
  } catch (error) {
    return `❌ Search failed: ${error.message}`;
  }
}

// Export for direct use in Node.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const query = process.argv[2];
  if (!query) {
    console.log('Usage: node lib/quick-search.js "search query"');
    process.exit(1);
  }
  
  console.log(`🔍 Searching for: "${query}"\n`);
  const results = await quickSearch(query, { includeContext: true });
  console.log(results);
  process.exit(0);
}