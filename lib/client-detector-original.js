/**
 * Client Detection Service
 * Shared service for detecting clients/groups from text across different contexts
 * (meetings, emails, slack, manual sessions)
 */

export class ClientDetector {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.debug = false;
  }

  /**
   * Main client detection method
   * @param {string} text - Text to analyze for client mentions
   * @param {string} context - Context type: 'meeting', 'email', 'slack', 'manual'
   * @param {object} options - Additional options
   * @returns {object} Detection result with status and client info
   */
  async detectClient(text, context = 'general', options = {}) {
    if (this.debug) console.log(`🔍 Detecting client in: "${text}" (context: ${context})`);
    
    try {
      // Extract potential client names from text
      const candidates = this.extractClientNames(text, context);
      
      if (candidates.length === 0) {
        return {
          status: 'no_candidates',
          message: 'No potential client names found in text',
          searched_text: text
        };
      }

      // Search for clients in database
      const searchResults = await this.searchClients(candidates);
      
      // Analyze results and determine response
      return this.formatDetectionResult(searchResults, candidates, text);
      
    } catch (error) {
      console.error('Client detection error:', error);
      return {
        status: 'error',
        message: 'Error during client detection',
        error: error.message
      };
    }
  }

  /**
   * Extract potential client names from text based on context
   */
  extractClientNames(text, context) {
    const candidates = new Set();
    const lowercaseText = text.toLowerCase();

    // Context-specific extraction patterns
    if (context === 'meeting') {
      // Look for meeting-specific phrases
      const meetingPatterns = [
        /(?:this is (?:a )?meeting of|meeting for|session (?:with|for)) (?:the )?(.+?)(?:\.|$|,|\s+and\s+)/gi,
        /(?:we are|this is) (?:the )?(.+?) (?:team|group|club|committee|organization)/gi,
        /(?:welcome to|starting) (?:the )?(.+?) (?:meeting|session)/gi
      ];
      
      meetingPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1]) candidates.add(match[1].trim());
        }
      });
    }
    
    if (context === 'email') {
      // Look in subject lines and common email phrases
      const emailPatterns = [
        /(?:re:|fwd:|subject:)\s*(.+?)(?:\s|$)/gi,
        /(?:from|for) (?:the )?(.+?) (?:team|group|project)/gi,
        /(.+?) (?:discussion|meeting|update)/gi
      ];
      
      emailPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1]) candidates.add(match[1].trim());
        }
      });
    }

    if (context === 'slack') {
      // Look for channel names and @mentions
      const slackPatterns = [
        /#([a-zA-Z0-9\-_]+)/g,  // Channel names
        /(?:this is for|working on) (?:the )?(.+?)(?:\s|$)/gi
      ];
      
      slackPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1]) candidates.add(match[1].trim());
        }
      });
    }

    // General patterns that work across contexts
    const generalPatterns = [
      /(?:client|customer|account):\s*(.+?)(?:\s|$|,)/gi,
      /(?:project|initiative|program):\s*(.+?)(?:\s|$|,)/gi,
      /(?:group|team|organization|company|club):\s*(.+?)(?:\s|$|,)/gi
    ];

    generalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) candidates.add(match[1].trim());
      }
    });

    // Clean up candidates
    const cleanedCandidates = Array.from(candidates)
      .map(candidate => this.cleanClientName(candidate))
      .filter(candidate => candidate.length > 1)  // Remove single characters
      .filter(candidate => !this.isCommonWord(candidate));

    if (this.debug) {
      console.log(`   Found candidates: ${JSON.stringify(cleanedCandidates)}`);
    }

    return cleanedCandidates;
  }

  /**
   * Clean and normalize client name candidates
   */
  cleanClientName(name) {
    return name
      .replace(/[^\w\s\-&]/g, ' ')  // Remove special chars except hyphens and ampersands
      .replace(/\s+/g, ' ')         // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  /**
   * Filter out common words that aren't client names
   */
  isCommonWord(word) {
    const commonWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
      'those', 'meeting', 'session', 'discussion', 'call', 'today', 'now'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Search for clients in database using exact and fuzzy matching
   */
  async searchClients(candidates) {
    const results = {
      exact_matches: [],
      fuzzy_matches: [],
      keyword_matches: []
    };

    for (const candidate of candidates) {
      try {
        // Exact name matches
        const exactQuery = `
          SELECT id, name, metadata, 
                 'exact' as match_type, 1.0 as confidence
          FROM clients 
          WHERE LOWER(name) = $1
        `;
        const exactResults = await this.db.pool.query(exactQuery, [candidate.toLowerCase()]);
        results.exact_matches.push(...exactResults.rows);

        // Alias matches (if clients table has aliases)
        const aliasQuery = `
          SELECT id, name, metadata,
                 'alias' as match_type, 0.95 as confidence
          FROM clients 
          WHERE metadata->'aliases' ? $1
        `;
        const aliasResults = await this.db.pool.query(aliasQuery, [candidate]);
        results.exact_matches.push(...aliasResults.rows);

        // Fuzzy name matches using PostgreSQL similarity
        const fuzzyQuery = `
          SELECT id, name, metadata,
                 'fuzzy' as match_type, similarity(LOWER(name), $1) as confidence
          FROM clients 
          WHERE similarity(LOWER(name), $1) > 0.6
          ORDER BY confidence DESC
        `;
        const fuzzyResults = await this.db.pool.query(fuzzyQuery, [candidate.toLowerCase()]);
        results.fuzzy_matches.push(...fuzzyResults.rows);

        // Keyword matches in name (clients table doesn't have description)
        const keywordQuery = `
          SELECT id, name, metadata,
                 'keyword' as match_type, 0.7 as confidence
          FROM clients 
          WHERE LOWER(name) LIKE $1
        `;
        const keywordResults = await this.db.pool.query(keywordQuery, [`%${candidate}%`]);
        results.keyword_matches.push(...keywordResults.rows);

      } catch (error) {
        console.error(`Error searching for candidate "${candidate}":`, error);
      }
    }

    // Remove duplicates and sort by confidence
    results.exact_matches = this.deduplicateResults(results.exact_matches);
    results.fuzzy_matches = this.deduplicateResults(results.fuzzy_matches);
    results.keyword_matches = this.deduplicateResults(results.keyword_matches);

    return results;
  }

  /**
   * Remove duplicate results and sort by confidence
   */
  deduplicateResults(results) {
    const seen = new Set();
    const unique = results.filter(result => {
      if (seen.has(result.id)) return false;
      seen.add(result.id);
      return true;
    });
    
    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Format the detection results into a standardized response
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

  /**
   * Create a new client based on user confirmation
   */
  async createNewClient(name, description = '', metadata = {}) {
    try {
      const query = `
        INSERT INTO clients (name, metadata, created_at)
        VALUES ($1, $2, NOW())
        RETURNING id, name
      `;
      
      const result = await this.db.pool.query(query, [
        name,
        { ...metadata, created_by: 'client_detector', description }
      ]);

      return {
        status: 'created',
        client: result.rows[0],
        message: `Created new client: "${result.rows[0].name}"`
      };

    } catch (error) {
      console.error('Error creating new client:', error);
      return {
        status: 'error',
        message: 'Failed to create new client',
        error: error.message
      };
    }
  }

  /**
   * Enable debug logging
   */
  enableDebug() {
    this.debug = true;
  }

  /**
   * Test the detector with sample inputs
   */
  async test() {
    const testCases = [
      { text: "This is a meeting of the conflict club", context: "meeting" },
      { text: "Re: Conflict Resolution Club discussion", context: "email" },
      { text: "Starting session with the team", context: "manual" },
      { text: "Project Alpha meeting notes", context: "general" }
    ];

    console.log("🧪 Testing Client Detector:");
    for (const testCase of testCases) {
      console.log(`\nTest: "${testCase.text}" (${testCase.context})`);
      const result = await this.detectClient(testCase.text, testCase.context);
      console.log(`Result: ${result.status} - ${result.message}`);
    }
  }
}