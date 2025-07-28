/**
 * Milestone Detector - Detect milestone achievements in assistant responses
 */

export class MilestoneDetector {
  /**
   * Detect milestone achievements in assistant responses
   * @param {string} response - Assistant response text
   * @returns {Object} - Detection result with milestone info
   */
  static detectMilestone(response) {
    const milestonePatterns = [
      // Completion indicators
      /✅.*?(completed?|successful|finished|done|working|ready)/i,
      /\*\*.*?(complete|success|finished|migration|implementation).*?\*\*/i,
      /(?:migration|setup|installation|configuration).*?(?:complete|successful|finished)/i,
      
      // Achievement language
      /(?:successfully|now have|now using|fully operational|ready to)/i,
      /(?:all.*?migrated|system.*?working|database.*?ready)/i,
      
      // System state changes
      /(?:updated|migrated|converted|switched).*?(?:from|to).*?(?:postgresql|sqlite|database)/i,
    ];

    for (const pattern of milestonePatterns) {
      const match = response.match(pattern);
      if (match) {
        return {
          isMilestone: true,
          summary: this.extractMilestoneSummary(response, match[0]),
          milestone: this.generateMilestoneTag(match[0])
        };
      }
    }

    return { isMilestone: false };
  }

  /**
   * Extract milestone summary from response
   * @param {string} response - Full response text
   * @param {string} matchedText - The matched milestone text
   * @returns {string} - Extracted summary
   */
  static extractMilestoneSummary(response, matchedText) {
    // Find the most relevant sentence containing the milestone
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(matchedText.toLowerCase()) || 
          sentence.includes('✅') || 
          /(?:completed?|successful|finished|ready|working)/i.test(sentence)) {
        return sentence.trim();
      }
    }
    
    // Fallback to first meaningful sentence
    return sentences.find(s => s.length > 20)?.trim() || matchedText;
  }

  /**
   * Generate milestone tag from matched text
   * @param {string} matchedText - The matched milestone text
   * @returns {string} - Generated milestone tag
   */
  static generateMilestoneTag(matchedText) {
    if (/migration|migrat/i.test(matchedText)) return 'migration_complete';
    if (/install|setup/i.test(matchedText)) return 'installation_complete';
    if (/configur/i.test(matchedText)) return 'configuration_complete';
    if (/test/i.test(matchedText)) return 'testing_complete';
    if (/database|db/i.test(matchedText)) return 'database_ready';
    if (/deploy/i.test(matchedText)) return 'deployment_complete';
    
    return 'task_completed';
  }
}