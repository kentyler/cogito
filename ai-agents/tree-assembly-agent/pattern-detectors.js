/**
 * Pattern Detectors - Individual pattern detection strategies
 */

export class PatternDetectors {
  /**
   * Check for numbered list patterns
   */
  static checkNumberedList(content) {
    return /^\d+\./.test(content.trim()) || /^[a-z]\./.test(content.trim());
  }

  /**
   * Check for bullet list patterns
   */
  static checkBulletList(content) {
    return /^[-*•]/.test(content.trim());
  }

  /**
   * Check for section header patterns
   */
  static checkSectionHeaders(content) {
    return /^#+\s/.test(content.trim());
  }

  /**
   * Check for Q&A patterns
   */
  static checkQAPairs(content) {
    return content.includes('?') && (content.includes('answer') || content.includes('response'));
  }

  /**
   * Check for decision tree patterns
   */
  static checkDecisionTree(content) {
    return content.includes('if') && content.includes('then');
  }

  /**
   * Check for hierarchical patterns
   */
  static checkHierarchy(content) {
    return content.includes('consists of') || 
           content.includes('includes') || 
           content.includes('contains');
  }

  /**
   * Get all pattern checkers
   */
  static getPatternCheckers() {
    return [
      { name: 'numbered_list', check: this.checkNumberedList },
      { name: 'bullet_list', check: this.checkBulletList },
      { name: 'section_headers', check: this.checkSectionHeaders },
      { name: 'qa_pairs', check: this.checkQAPairs },
      { name: 'decision_tree', check: this.checkDecisionTree },
      { name: 'hierarchy', check: this.checkHierarchy }
    ];
  }
}