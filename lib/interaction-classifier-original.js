/**
 * Interaction Classifier for Auto-Recording Session Context
 * Distinguishes between planning discussions, milestones, and execution
 */

export class InteractionClassifier {
  
  /**
   * Classify an interaction based on content patterns
   * @param {string} humanInput - The human's input
   * @param {string} assistantResponse - The assistant's response
   * @returns {Object} Classification result
   */
  static classifyInteraction(humanInput, assistantResponse) {
    const classification = {
      shouldRecord: false,
      contextType: null,
      contextUpdate: null,
      milestone: null,
      thinkingProcess: null
    };

    // Check for analytical thinking and reasoning chains
    const thinkingResult = this.detectThinkingProcess(humanInput, assistantResponse);
    if (thinkingResult.hasThinking) {
      classification.thinkingProcess = thinkingResult;
    }

    // Check for milestone patterns in assistant response
    const milestoneResult = this.detectMilestone(assistantResponse);
    if (milestoneResult.isMilestone) {
      classification.shouldRecord = true;
      classification.contextType = 'milestone';
      classification.contextUpdate = milestoneResult.summary;
      classification.milestone = milestoneResult.milestone;
      return classification;
    }

    // Check for planning discussions
    const planningResult = this.detectPlanning(humanInput, assistantResponse);
    if (planningResult.isPlanning) {
      classification.shouldRecord = true;
      classification.contextType = 'planning';
      classification.contextUpdate = planningResult.summary;
      return classification;
    }

    // If we have significant thinking but no other category, record as insight
    if (thinkingResult.hasThinking && thinkingResult.significance !== 'minor') {
      classification.shouldRecord = true;
      classification.contextType = 'insight';
      classification.contextUpdate = thinkingResult.summary;
      return classification;
    }

    // Not worth recording
    return classification;
  }

  /**
   * Detect milestone achievements in assistant responses
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

    const milestoneKeywords = [
      'completed', 'successful', 'finished', 'working', 'ready',
      'migrated', 'updated', 'converted', 'installed', 'configured'
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
   * Detect planning discussions
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
   * Extract milestone summary from response
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
   * Extract planning discussion summary
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

  /**
   * Generate milestone tag from matched text
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

  /**
   * Detect analytical thinking processes in responses
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
   */
  static extractConcepts(response) {
    const conceptWords = response.match(/\b(?:architecture|design|system|framework|approach|methodology|strategy|technique|pattern|structure|relationship|connection|integration|synthesis|evolution)\b/gi);
    return [...new Set(conceptWords || [])].slice(0, 5);
  }

  /**
   * Generate summary of thinking process
   */
  static generateThinkingSummary(humanInput, assistantResponse, processType) {
    const inputSummary = humanInput.length > 100 ? 
      humanInput.substring(0, 100) + '...' : humanInput;
    
    const responseCore = assistantResponse.split('.')[0] + '.';
    
    return `${processType || 'Analysis'}: ${inputSummary} → ${responseCore}`;
  }

  /**
   * Should skip recording (execution/debugging activities)
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
}