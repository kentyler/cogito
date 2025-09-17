/**
 * Turn Addressing Processor - Parse @mentions and /citations
 * 
 * Handles:
 * - @username mentions for notifications
 * - @Cogito for LLM invocation
 * - /citation references for context linking
 */

export class TurnAddressingProcessor {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Parse @ mentions and / citations from content
   * @param {string} content - Turn content to parse
   * @returns {Object} Parsed addressing information
   */
  parseAddressing(content) {
    if (!content) return this._emptyAddressing();

    // Remove email addresses to avoid false matches
    const contentWithoutEmails = content.replace(/\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '');
    
    // Find @ mentions
    const mentions = this._extractMentions(contentWithoutEmails);
    
    // Find / citations  
    const citations = this._extractCitations(contentWithoutEmails);

    // Check for Cogito addressing
    const shouldInvokeCogito = this._detectCogitoAddress(contentWithoutEmails);

    return {
      mentions,
      citations,
      shouldInvokeCogito,
      directedTo: [], // Will be resolved later
      metadata: {
        mentions,
        citations,
        shouldInvokeCogito,
        isComment: !shouldInvokeCogito && mentions.length === 0
      }
    };
  }

  /**
   * Extract @username mentions
   * @private
   */
  _extractMentions(content) {
    const mentionPattern = /(?:^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[^\w@.])/g;
    return [...content.matchAll(mentionPattern)]
      .map(match => match[1])
      .filter(username => username.length > 0);
  }

  /**
   * Extract /citation references
   * @private
   */
  _extractCitations(content) {
    const citationPattern = /(?:^|\s)\/([^\s]+)/g;
    return [...content.matchAll(citationPattern)]
      .map(match => match[1])
      .filter(citation => citation.length > 0);
  }

  /**
   * Detect @Cogito addressing (solitary @)
   * @private
   */
  _detectCogitoAddress(content) {
    return /(?:^|\s)@(?!\w)/.test(content);
  }

  /**
   * Empty addressing structure
   * @private
   */
  _emptyAddressing() {
    return {
      mentions: [],
      citations: [],
      shouldInvokeCogito: false,
      directedTo: [],
      metadata: {
        mentions: [],
        citations: [],
        shouldInvokeCogito: false,
        isComment: true
      }
    };
  }

  /**
   * Resolve @mention names to user IDs
   * @param {Array} mentions - Array of mention strings
   * @returns {Promise<Array>} Array of user IDs
   */
  async resolveMentionsToUserIds(mentions) {
    const userIds = [];

    for (const mention of mentions) {
      // Skip Cogito mentions
      if (mention.toLowerCase() === 'cogito') continue;

      try {
        // Look up user by display_name
        const result = await this.dbAgent.connector.query(`
          SELECT id FROM client_mgmt.users 
          WHERE LOWER(display_name) = LOWER($1)
          LIMIT 1
        `, [mention]);

        if (result.rows.length > 0) {
          userIds.push(result.rows[0].id);
        } else {
          // Log event for unknown mention
          await this.dbAgent.logEvent('turn_mention_unresolved', {
            mention,
            attempted_at: new Date().toISOString()
          }, {
            component: 'TurnAddressingProcessor',
            severity: 'warning'
          });
        }
      } catch (error) {
        // Log error event
        await this.dbAgent.logError('turn_mention_resolution_failed', error, {
          component: 'TurnAddressingProcessor',
          mention,
          severity: 'error'
        });
      }
    }

    return userIds;
  }

  /**
   * Validate addressing data
   * @param {Object} addressing - Addressing object to validate
   * @returns {boolean} True if valid
   */
  validateAddressing(addressing) {
    if (!addressing || typeof addressing !== 'object') return false;
    
    const requiredFields = ['mentions', 'citations', 'shouldInvokeCogito', 'metadata'];
    return requiredFields.every(field => addressing.hasOwnProperty(field));
  }
}