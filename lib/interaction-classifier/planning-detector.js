/**
 * Planning Detector - Detect planning discussions in interactions
 */

export class PlanningDetector {
  /**
   * Detect planning discussions
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {Object} - Detection result with planning info
   */
  static detectPlanning(humanInput, assistantResponse) {
    const planningPatterns = [
      // Question patterns in human input
      /(?:how|what|should|could|would|can).*?(?:we|you|i).*?(?:approach|implement|design|handle)/i,
      /(?:what.*?think|thoughts|opinion|recommend|suggest)/i,
      /(?:better|best).*?(?:way|approach|method|solution)/i,
      
      // Architecture discussions
      /(?:architecture|design|structure|approach|strategy|pattern)/i,
      /(?:database|schema|table|api|interface|system)/i,
      
      // Decision-making language
      /(?:decide|choose|option|alternative|consider)/i,
      /(?:pros|cons|advantage|disadvantage|trade.?off)/i,
      
      // Problem-solving
      /(?:problem|issue|challenge|solution|fix)/i,
      /(?:why|because|reason|rationale)/i
    ];

    const assistantPlanningPatterns = [
      // Strategic thinking responses
      /(?:approach|strategy|design|architecture|implementation)/i,
      /(?:we could|options|alternatives|considerations)/i,
      /(?:pros|cons|trade.?offs|benefits|drawbacks)/i,
      /(?:recommend|suggest|think|propose)/i
    ];

    // Check human input for planning questions
    const humanPlanning = planningPatterns.some(pattern => 
      pattern.test(humanInput)
    );

    // Check assistant response for strategic thinking
    const assistantPlanning = assistantPlanningPatterns.some(pattern =>
      pattern.test(assistantResponse)
    );

    if (humanPlanning || assistantPlanning) {
      return {
        isPlanning: true,
        summary: this.extractPlanningSummary(humanInput, assistantResponse)
      };
    }

    return { isPlanning: false };
  }

  /**
   * Extract planning discussion summary
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {string} - Extracted planning summary
   */
  static extractPlanningSummary(humanInput, assistantResponse) {
    // Combine key parts of the discussion
    const humanSummary = humanInput.length > 100 ? 
      humanInput.substring(0, 100) + '...' : humanInput;
    
    // Find strategic parts of assistant response
    const sentences = assistantResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const strategicSentence = sentences.find(s => 
      /(?:approach|strategy|recommend|suggest|could|should)/i.test(s)
    ) || sentences[0];
    
    return `Planning: ${humanSummary.trim()} | Response: ${strategicSentence?.trim() || 'Strategic discussion'}`;
  }
}