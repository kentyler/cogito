/**
 * Result Formatter - Format search results and generate clarification prompts
 */

export class ResultFormatter {
  /**
   * Format the detection results into a standardized response
   * @param {Object} searchResults - Results from client search
   * @param {Array} candidates - Original candidate names
   * @param {string} originalText - Original input text
   * @returns {Object} - Formatted detection result
   */
  formatDetectionResult(searchResults, candidates, originalText) {
    const { exact_matches, fuzzy_matches, keyword_matches } = searchResults;

    // Single exact match - success!
    if (exact_matches.length === 1) {
      return {
        status: 'found',
        client: exact_matches[0],
        confidence: exact_matches[0].confidence,
        message: `Identified client: "${exact_matches[0].name}"`,
        candidates_searched: candidates
      };
    }

    // Multiple exact matches - need disambiguation
    if (exact_matches.length > 1) {
      return {
        status: 'multiple_exact',
        clients: exact_matches,
        message: `Found ${exact_matches.length} exact matches. Please specify which one.`,
        suggested_clarification: this.generateClarificationPrompt(exact_matches, 'multiple'),
        candidates_searched: candidates
      };
    }

    // No exact matches but have fuzzy matches
    if (fuzzy_matches.length > 0) {
      const bestMatch = fuzzy_matches[0];
      
      if (bestMatch.confidence > 0.8) {
        // High confidence fuzzy match
        return {
          status: 'fuzzy_match',
          client: bestMatch,
          confidence: bestMatch.confidence,
          message: `Found similar client: "${bestMatch.name}" (${Math.round(bestMatch.confidence * 100)}% match)`,
          suggested_clarification: `Did you mean "${bestMatch.name}"?`,
          candidates_searched: candidates
        };
      } else {
        // Lower confidence, show options
        return {
          status: 'near_miss',
          clients: fuzzy_matches.slice(0, 3), // Top 3 matches
          message: `Found similar clients. Which one did you mean?`,
          suggested_clarification: this.generateClarificationPrompt(fuzzy_matches.slice(0, 3), 'similar'),
          candidates_searched: candidates
        };
      }
    }

    // No matches found
    return {
      status: 'not_found',
      message: `No matching clients found for: ${candidates.join(', ')}`,
      suggested_clarification: `I don't recognize any clients matching "${candidates.join('" or "')}". Is this a new client, or should I search for a different name?`,
      candidates_searched: candidates,
      original_text: originalText
    };
  }

  /**
   * Generate clarification prompts for Dr. CC to ask
   * @param {Array} clients - Array of client objects
   * @param {string} type - Type of clarification needed ('multiple' or 'similar')
   * @returns {string} - Clarification prompt text
   */
  generateClarificationPrompt(clients, type) {
    if (type === 'multiple') {
      const clientList = clients.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      return `I found multiple clients with that name:\n${clientList}\n\nWhich one is this session for?`;
    }
    
    if (type === 'similar') {
      const clientList = clients.map((c, i) => 
        `${i + 1}. ${c.name} (${Math.round(c.confidence * 100)}% match)`
      ).join('\n');
      return `I found these similar clients:\n${clientList}\n\nWhich one did you mean, or is this a different client?`;
    }

    return 'Could you provide more details about the client?';
  }
}