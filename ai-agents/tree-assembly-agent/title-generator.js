/**
 * Title Generator - Generates descriptive titles for trees
 */

export class TitleGenerator {
  /**
   * Generate a descriptive title for the tree
   */
  static generateTreeTitle(treeType, fragments) {
    const typeToTitle = {
      'ordered_list': 'Sequential Process',
      'unordered_list': 'Key Points',
      'document_outline': 'Document Structure', 
      'faq_tree': 'Questions & Answers',
      'decision_flow': 'Decision Tree',
      'concept_hierarchy': 'Concept Map',
      'topic_cluster': 'Related Topics',
      'mixed_content': 'Content Collection'
    };
    
    const baseTitle = typeToTitle[treeType] || 'Content Tree';
    
    // Try to infer more specific title from fragment content
    const commonTerms = this.extractCommonTerms(fragments);
    if (commonTerms.length > 0) {
      return `${baseTitle}: ${commonTerms[0]}`;
    }
    
    return baseTitle;
  }

  /**
   * Extract common terms from fragments to enhance title
   */
  static extractCommonTerms(fragments) {
    const termCounts = {};
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    
    fragments.forEach(fragment => {
      const words = fragment.content_text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));
      
      words.forEach(word => {
        termCounts[word] = (termCounts[word] || 0) + 1;
      });
    });
    
    return Object.entries(termCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([term]) => term.charAt(0).toUpperCase() + term.slice(1));
  }
}