/**
 * Fragment Grouper - Groups fragments by pattern similarity for tree assembly
 */

import { PatternDetectors } from './pattern-detectors.js';

export class FragmentGrouper {
  /**
   * Group fragments by their detected patterns
   */
  groupFragmentsByPattern(fragments) {
    const groups = {};
    
    fragments.forEach(fragment => {
      const patterns = this.detectPatterns(fragment);
      
      patterns.forEach(pattern => {
        if (!groups[pattern]) {
          groups[pattern] = [];
        }
        groups[pattern].push(fragment);
      });
    });
    
    return groups;
  }

  /**
   * Detect patterns in a fragment that suggest tree membership
   */
  detectPatterns(fragment) {
    const patterns = [];
    const content = fragment.content_text.toLowerCase();
    
    const patternCheckers = PatternDetectors.getPatternCheckers();
    
    // Run all pattern checkers
    for (const { name, check } of patternCheckers) {
      if (check(content)) {
        patterns.push(name);
      }
    }
    
    // Default pattern if nothing specific detected
    if (patterns.length === 0) {
      patterns.push('general_content');
    }
    
    return patterns;
  }

  /**
   * Determine if fragments form a coherent tree structure
   */
  determineTreeType(fragments) {
    const patterns = {};
    
    // Count pattern occurrences
    fragments.forEach(fragment => {
      const fragmentPatterns = this.detectPatterns(fragment);
      fragmentPatterns.forEach(pattern => {
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      });
    });
    
    // Need at least 3 fragments to form a meaningful tree
    if (fragments.length < 3) {
      return null;
    }
    
    // Determine dominant pattern
    const sortedPatterns = Object.entries(patterns)
      .sort(([,a], [,b]) => b - a);
    
    if (sortedPatterns.length === 0) {
      return null;
    }
    
    const [dominantPattern, count] = sortedPatterns[0];
    
    // Pattern must appear in at least 60% of fragments
    if (count / fragments.length < 0.6) {
      return null;
    }
    
    // Map patterns to tree types
    const patternToTreeType = {
      'numbered_list': 'ordered_list',
      'bullet_list': 'unordered_list', 
      'section_headers': 'document_outline',
      'qa_pairs': 'faq_tree',
      'decision_tree': 'decision_flow',
      'hierarchy': 'concept_hierarchy',
      'general_content': 'topic_cluster'
    };
    
    return patternToTreeType[dominantPattern] || 'mixed_content';
  }
}