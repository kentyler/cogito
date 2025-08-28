/**
 * Thinking Detector - Detect analytical thinking processes in responses
 */

export class ThinkingDetector {
  /**
   * Detect analytical thinking processes in responses
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @returns {Object} - Detection result with thinking analysis
   */
  static detectThinkingProcess(humanInput, assistantResponse) {
    const thinkingIndicators = {
      synthesis: [
        /That's.*?(?:insight|recognition|connection)/i,
        /(?:combines|integrates|synthesizes|merges)/i,
        /(?:unified|coherent|comprehensive).*?(?:vision|approach|system)/i
      ],
      analysis: [
        /(?:Looking at|Analyzing|Examining|Considering)/i,
        /(?:patterns|structure|relationships|implications)/i,
        /(?:on one hand|on the other hand|however|whereas)/i
      ],
      recognition: [
        /(?:I see|I recognize|I notice|This shows)/i,
        /(?:reveals|demonstrates|indicates|suggests)/i,
        /(?:pattern|connection|alignment|similarity)/i
      ],
      breakthrough: [
        /(?:breakthrough|profound|revolutionary|fundamental)/i,
        /(?:completely changes|transforms|revolutionizes)/i,
        /(?:game.?changing|paradigm.?shift)/i
      ],
      connection: [
        /(?:connects to|relates to|builds on|extends)/i,
        /(?:similar to|reminds me of|parallel to)/i,
        /(?:maps.*?onto|aligns.*?with)/i
      ]
    };

    const reasoningPatterns = [
      /(?:because|since|therefore|thus|hence)/i,
      /(?:this means|this implies|this suggests)/i,
      /(?:if.*?then|given.*?we)/i,
      /(?:first|second|third|next|finally)/i
    ];

    const conceptPatterns = [
      /(?:architecture|design|system|framework)/i,
      /(?:approach|methodology|strategy|technique)/i,
      /(?:pattern|structure|relationship|connection)/i
    ];

    let processType = null;
    let hasReasoning = false;
    let hasConcepts = false;
    let significance = 'minor';

    // Detect thinking type
    for (const [type, patterns] of Object.entries(thinkingIndicators)) {
      if (patterns.some(pattern => pattern.test(assistantResponse))) {
        processType = type;
        if (type === 'breakthrough' || type === 'synthesis') {
          significance = 'major';
        } else if (type === 'recognition' || type === 'connection') {
          significance = 'moderate';
        }
        break;
      }
    }

    // Check for reasoning chains
    hasReasoning = reasoningPatterns.some(pattern => 
      pattern.test(assistantResponse)
    );

    // Check for concept connections
    hasConcepts = conceptPatterns.some(pattern => 
      pattern.test(assistantResponse)
    );

    const hasThinking = processType || (hasReasoning && hasConcepts);

    if (hasThinking) {
      return {
        hasThinking: true,
        processType: processType || 'analysis',
        significance,
        triggerContext: humanInput.substring(0, 200),
        reasoningChain: this.extractReasoningChain(assistantResponse),
        conceptsConnected: this.extractConcepts(assistantResponse),
        summary: this.generateThinkingSummary(humanInput, assistantResponse, processType)
      };
    }

    return { hasThinking: false };
  }

  /**
   * Extract reasoning chain from response
   * @param {string} response - Assistant response text
   * @returns {string} - Extracted reasoning chain
   */
  static extractReasoningChain(response) {
    // Find sentences that contain reasoning indicators
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const reasoningSentences = sentences.filter(sentence => 
      /(?:because|since|therefore|thus|hence|this means|this implies|if.*?then)/i.test(sentence)
    );
    
    return reasoningSentences.slice(0, 3).join('. ') + '.';
  }

  /**
   * Extract key concepts mentioned
   * @param {string} response - Assistant response text
   * @returns {Array} - Array of extracted concepts
   */
  static extractConcepts(response) {
    const conceptWords = response.match(/\b(?:architecture|design|system|framework|approach|methodology|strategy|technique|pattern|structure|relationship|connection|integration|synthesis|evolution)\b/gi);
    return [...new Set(conceptWords || [])].slice(0, 5);
  }

  /**
   * Generate summary of thinking process
   * @param {string} humanInput - Human input text
   * @param {string} assistantResponse - Assistant response text
   * @param {string} processType - Type of thinking process
   * @returns {string} - Generated thinking summary
   */
  static generateThinkingSummary(humanInput, assistantResponse, processType) {
    const inputSummary = humanInput.length > 100 ? 
      humanInput.substring(0, 100) + '...' : humanInput;
    
    const responseCore = assistantResponse.split('.')[0] + '.';
    
    return `${processType || 'Analysis'}: ${inputSummary} → ${responseCore}`;
  }
}