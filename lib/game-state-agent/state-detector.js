/**
 * State Detection Module - Pattern matching for game state declarations
 */

export class StateDetector {
  /**
   * Detect explicit state declarations in conversation content
   * @param {string} content - Content to analyze
   * @returns {Object} Detection result
   */
  detectStateDeclaration(content) {
    const lowerContent = content.toLowerCase();

    // Game start patterns
    const gameStartPatterns = [
      /let['']?s start (?:the )?(.+?) game/i,
      /we['']?re playing (?:the )?(.+?) game/i,
      /starting (?:the )?(.+?) game/i,
      /begin (?:the )?(.+?) game/i
    ];

    for (const pattern of gameStartPatterns) {
      const match = content.match(pattern);
      if (match) {
        return {
          declared: true,
          state: {
            type: 'identified',
            gameName: match[1].trim().replace(/\s+/g, '-'),
            displayName: match[1].trim()
          },
          message: `🎮 Game Started: "${match[1].trim()}" - Cards and patterns will be tracked.`
        };
      }
    }

    // Unidentified mode patterns
    const unidentifiedPatterns = [
      /unidentified mode/i,
      /don['']?t know what game/i,
      /not sure if this is a game/i,
      /working without a specific game/i,
      /exploring without.*game/i,
      /no declared game/i
    ];

    for (const pattern of unidentifiedPatterns) {
      if (pattern.test(content)) {
        return {
          declared: true,
          state: {
            type: 'unidentified',
            reason: 'explicit_declaration'
          },
          message: `🔍 Unidentified Mode: Acknowledged - working without a specific game framework.`
        };
      }
    }

    return { declared: false };
  }
}