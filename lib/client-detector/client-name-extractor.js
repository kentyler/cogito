/**
 * Client Name Extractor - Extract potential client names from text based on context
 */

export class ClientNameExtractor {
  constructor(debug = false) {
    this.debug = debug;
  }

  /**
   * Extract potential client names from text based on context
   * @param {string} text - Text to analyze
   * @param {string} context - Context type: 'meeting', 'email', 'slack', 'manual'
   * @returns {Array} - Array of cleaned client name candidates
   */
  extractClientNames(text, context) {
    const candidates = new Set();

    // Context-specific extraction patterns
    if (context === 'meeting') {
      this.extractMeetingPatterns(text, candidates);
    }
    
    if (context === 'email') {
      this.extractEmailPatterns(text, candidates);
    }

    if (context === 'slack') {
      this.extractSlackPatterns(text, candidates);
    }

    // General patterns that work across contexts
    this.extractGeneralPatterns(text, candidates);

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
   * Extract client names from meeting-specific patterns
   */
  extractMeetingPatterns(text, candidates) {
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

  /**
   * Extract client names from email-specific patterns
   */
  extractEmailPatterns(text, candidates) {
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

  /**
   * Extract client names from Slack-specific patterns
   */
  extractSlackPatterns(text, candidates) {
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

  /**
   * Extract client names from general patterns
   */
  extractGeneralPatterns(text, candidates) {
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
}