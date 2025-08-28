/**
 * Interaction Filter - Skip patterns and filtering logic for interactions
 */

export class InteractionFilter {
  /**
   * Should skip recording (execution/debugging activities)
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {boolean} - True if interaction should be skipped
   */
  static shouldSkipRecording(humanInput, assistantResponse) {
    const skipPatterns = [
      // File operations
      /(?:read|edit|write|create).*?file/i,
      /(?:line \d+|change.*?to|replace.*?with)/i,
      
      // Command execution
      /(?:run|execute|install|npm|node|psql)/i,
      /(?:ls|cd|mkdir|rm|mv|cp)/i,
      
      // Debugging
      /(?:error|debug|fix|bug|issue.*?line)/i,
      /(?:console\.log|print|output)/i,
      
      // Very short interactions
      /^.{1,20}$/
    ];

    return skipPatterns.some(pattern => 
      pattern.test(humanInput) || pattern.test(assistantResponse)
    );
  }

  /**
   * Check if interaction meets minimum quality thresholds
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {boolean} - True if interaction meets quality thresholds
   */
  static meetsQualityThreshold(humanInput, assistantResponse) {
    // Minimum length requirements
    if (humanInput.length < 5 || assistantResponse.length < 20) {
      return false;
    }

    // Check for substantial content
    const hasSubstantialContent = 
      humanInput.split(' ').length > 3 && 
      assistantResponse.split(' ').length > 10;

    return hasSubstantialContent;
  }

  /**
   * Determine if interaction is routine/repetitive
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {boolean} - True if interaction is routine
   */
  static isRoutineInteraction(humanInput, assistantResponse) {
    const routinePatterns = [
      // Simple confirmations
      /^(?:yes|no|ok|okay|sure|thanks|thank you)\.?$/i,
      
      // Status checks
      /^(?:status|check|show|list).*$/i,
      
      // Simple requests
      /^(?:please|can you|could you).*(?:check|show|tell).*$/i
    ];

    return routinePatterns.some(pattern => 
      pattern.test(humanInput.trim())
    );
  }
}