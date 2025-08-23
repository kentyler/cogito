/**
 * Fragment Pattern Recognition
 * Contains pattern matching rules for different TOC element types
 */

export class PatternRecognition {
  constructor() {
    // TOC pattern recognition rules
    this.extractionPatterns = {
      undesirable_effect: [
        /(?:i'm|i am|we're|we are)\s+(?:frustrated|annoyed|stuck|blocked|having trouble)\s+(?:with|by)/i,
        /(?:the problem is|the issue is|this is problematic|this doesn't work)/i,
        /(?:keeps failing|won't work|is broken|doesn't function)/i,
        /(?:users are complaining|users report|customers are experiencing)/i
      ],
      obstacle: [
        /(?:can't|cannot|unable to|blocked by|prevented by)/i,
        /(?:missing|lacking|don't have|need to get|requires)/i,
        /(?:depends on|waiting for|blocked until|need to first)/i,
        /(?:the challenge is|the difficulty is|the barrier is)/i
      ],
      constraint: [
        /(?:limited by|constrained by|bottleneck|capacity issue)/i,
        /(?:only\s+\d+|maximum|can only handle|at most)/i,
        /(?:resource constraint|memory constraint|time constraint)/i
      ],
      conflict: [
        /(?:want to|need to).+(?:but also|however|yet also|while also)/i,
        /(?:torn between|conflicted about|can't decide between)/i,
        /(?:on one hand.+on the other hand)/i,
        /(?:either.+or|choose between)/i
      ],
      injection: [
        /(?:what if we|we could|let's try|maybe we should|how about)/i,
        /(?:solution might be|approach would be|way to fix)/i,
        /(?:suggestion|recommendation|propose|suggest)/i
      ],
      assumption: [
        /(?:assume|assuming|believe|think|expect|suppose)/i,
        /(?:obviously|clearly|of course|naturally)/i,
        /(?:must be|has to be|should be|ought to)/i
      ],
      need: [
        /(?:need to|have to|must|require|essential|critical)/i,
        /(?:in order to|so that|to achieve|to accomplish)/i,
        /(?:goal is|objective is|trying to|want to achieve)/i
      ],
      want: [
        /(?:want to|would like to|prefer to|hoping to)/i,
        /(?:wish|desire|looking for|seeking)/i,
        /(?:ideally|preferably|optimally)/i
      ]
    };
  }

  /**
   * Extract TOC fragments from text using pattern matching
   */
  extractFragmentsFromText(text) {
    const fragments = [];
    
    // Split text into sentences for analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length < 10) continue; // Skip very short sentences
      
      // Check each TOC pattern type
      for (const [elementType, patterns] of Object.entries(this.extractionPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(cleanSentence)) {
            fragments.push({
              fragment_type: 'node',
              toc_element_type: elementType,
              label: this.cleanExtractedText(cleanSentence),
              description: null,
              evidence: cleanSentence,
              confidence: this.calculateConfidence(cleanSentence, pattern)
            });
            break; // Only one fragment per sentence to avoid duplicates
          }
        }
      }
    }

    return fragments;
  }

  /**
   * Clean extracted text for use as fragment label
   */
  cleanExtractedText(text) {
    return text
      .replace(/^(?:i'm|i am|we're|we are|the problem is|the issue is)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Calculate confidence based on pattern strength and text characteristics
   */
  calculateConfidence(text, pattern) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for longer, more detailed expressions
    if (text.length > 50) confidence += 0.1;
    if (text.length > 100) confidence += 0.1;
    
    // Increase confidence for specific keywords
    const strongIndicators = ['frustrated', 'blocked', 'problem', 'issue', 'can\'t', 'unable', 'need to'];
    for (const indicator of strongIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        confidence += 0.1;
        break;
      }
    }
    
    // Decrease confidence for uncertain language
    const uncertainIndicators = ['maybe', 'perhaps', 'might', 'could be', 'possibly'];
    for (const indicator of uncertainIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        confidence -= 0.15;
        break;
      }
    }
    
    return Math.max(0.1, Math.min(0.9, confidence));
  }
}