/**
 * Capability Recognizer - Identifies demonstrated capabilities from conversation history
 * 
 * Focuses on pattern recognition of actual demonstrated skills rather than
 * generic encouragement. Helps unlock existing cognitive capacity.
 */

export class CapabilityRecognizer {
  constructor(database) {
    this.db = database;
  }

  /**
   * Analyze conversation history to identify demonstrated capabilities
   */
  async recognizeCapabilities(collaborator, currentInput, sessionContext = {}) {
    // Get recent interaction history
    const recentInteractions = await this.getRecentInteractions(collaborator);
    
    // Identify patterns of demonstrated thinking
    const capabilities = await this.identifyThinkingPatterns(recentInteractions, currentInput);
    
    // Detect current cognitive state (stuck vs. flowing)
    const cognitiveState = this.assessCognitiveState(currentInput, recentInteractions);
    
    return {
      demonstratedCapabilities: capabilities,
      cognitiveState: cognitiveState,
      recommendations: this.generateRecommendations(capabilities, cognitiveState, currentInput)
    };
  }

  /**
   * Get recent interaction history for pattern analysis
   */
  async getRecentInteractions(collaborator, limit = 10) {
    try {
      const query = `
        SELECT human_input, spokesperson_response, timestamp, interaction_type
        FROM public_interactions 
        WHERE collaborator = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      
      const result = await this.db.pool.query(query, [collaborator, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching recent interactions:', error);
      return [];
    }
  }

  /**
   * Identify patterns of demonstrated thinking capabilities
   */
  async identifyThinkingPatterns(interactions, currentInput) {
    const capabilities = [];

    // Pattern: Systems thinking
    const systemsThinking = this.detectSystemsThinking(interactions);
    if (systemsThinking.demonstrated) {
      capabilities.push({
        type: 'systems_thinking',
        evidence: systemsThinking.evidence,
        strength: systemsThinking.strength,
        description: 'Consistently sees connections between different parts of complex systems'
      });
    }

    // Pattern: Problem decomposition
    const problemDecomposition = this.detectProblemDecomposition(interactions);
    if (problemDecomposition.demonstrated) {
      capabilities.push({
        type: 'problem_decomposition',
        evidence: problemDecomposition.evidence,
        strength: problemDecomposition.strength,
        description: 'Naturally breaks complex problems into manageable pieces'
      });
    }

    // Pattern: Pattern recognition
    const patternRecognition = this.detectPatternRecognition(interactions, currentInput);
    if (patternRecognition.demonstrated) {
      capabilities.push({
        type: 'pattern_recognition',
        evidence: patternRecognition.evidence,
        strength: patternRecognition.strength,
        description: 'Identifies recurring patterns and connections across different domains'
      });
    }

    // Pattern: Creative synthesis
    const creativeSynthesis = this.detectCreativeSynthesis(interactions);
    if (creativeSynthesis.demonstrated) {
      capabilities.push({
        type: 'creative_synthesis',
        evidence: creativeSynthesis.evidence,
        strength: creativeSynthesis.strength,
        description: 'Combines ideas from different sources in novel ways'
      });
    }

    // Pattern: Iterative refinement
    const iterativeRefinement = this.detectIterativeRefinement(interactions);
    if (iterativeRefinement.demonstrated) {
      capabilities.push({
        type: 'iterative_refinement',
        evidence: iterativeRefinement.evidence,
        strength: iterativeRefinement.strength,
        description: 'Builds on ideas progressively, refining and improving approaches'
      });
    }

    return capabilities;
  }

  /**
   * Detect systems thinking capability
   */
  detectSystemsThinking(interactions) {
    const systemsIndicators = [
      /\b(connect|relationship|interaction|influence|impact|affect)\b/i,
      /\b(system|architecture|structure|pattern|flow)\b/i,
      /\b(between|across|through|integration|coordination)\b/i,
      /\bhow.*work.*together\b/i,
      /\bripple.*effect\b/i,
      /\bdownstream|upstream\b/i
    ];

    let evidence = [];
    let matches = 0;

    interactions.forEach(interaction => {
      const combinedText = `${interaction.human_input} ${interaction.spokesperson_response}`;
      systemsIndicators.forEach(pattern => {
        if (pattern.test(combinedText)) {
          matches++;
          if (evidence.length < 3) { // Keep top evidence
            evidence.push({
              text: interaction.human_input.substring(0, 100),
              timestamp: interaction.timestamp
            });
          }
        }
      });
    });

    return {
      demonstrated: matches >= 3,
      strength: Math.min(matches / 10, 1), // Scale 0-1
      evidence: evidence
    };
  }

  /**
   * Detect problem decomposition capability
   */
  detectProblemDecomposition(interactions) {
    const decompositionIndicators = [
      /\b(first|second|third|then|next|step|phase)\b/i,
      /\b(break.*down|divide|separate|component|piece|part)\b/i,
      /\b(one.*thing|another.*thing|also|additionally)\b/i,
      /\b(before.*can|need.*to.*first|prerequisite)\b/i,
      /\bmultiple.*parts\b/i
    ];

    let evidence = [];
    let matches = 0;

    interactions.forEach(interaction => {
      decompositionIndicators.forEach(pattern => {
        if (pattern.test(interaction.human_input)) {
          matches++;
          if (evidence.length < 3) {
            evidence.push({
              text: interaction.human_input.substring(0, 100),
              timestamp: interaction.timestamp
            });
          }
        }
      });
    });

    return {
      demonstrated: matches >= 2,
      strength: Math.min(matches / 8, 1),
      evidence: evidence
    };
  }

  /**
   * Detect pattern recognition capability
   */
  detectPatternRecognition(interactions, currentInput) {
    const patternIndicators = [
      /\b(pattern|similar|like.*before|reminds.*me|always|usually|tends)\b/i,
      /\b(this.*is.*like|same.*as|different.*from|compare)\b/i,
      /\b(recurring|repeated|again|another.*example)\b/i,
      /\bi.*notice|i.*see.*that|it.*seems|appears.*that\b/i
    ];

    let evidence = [];
    let matches = 0;

    // Check both historical interactions and current input
    const allInputs = [...interactions.map(i => ({ text: i.human_input, timestamp: i.timestamp }))];
    if (currentInput) {
      allInputs.push({ text: currentInput, timestamp: new Date() });
    }

    allInputs.forEach(input => {
      patternIndicators.forEach(pattern => {
        if (pattern.test(input.text)) {
          matches++;
          if (evidence.length < 3) {
            evidence.push({
              text: input.text.substring(0, 100),
              timestamp: input.timestamp
            });
          }
        }
      });
    });

    return {
      demonstrated: matches >= 2,
      strength: Math.min(matches / 6, 1),
      evidence: evidence
    };
  }

  /**
   * Detect creative synthesis capability
   */
  detectCreativeSynthesis(interactions) {
    const synthesisIndicators = [
      /\b(combine|merge|bring.*together|synthesize|integrate)\b/i,
      /\b(what.*if.*we|could.*we|might.*work|creative|novel|innovative)\b/i,
      /\b(different.*approach|new.*way|alternative|hybrid)\b/i,
      /\b(both.*and|not.*either.*or|spectrum|balance)\b/i
    ];

    let evidence = [];
    let matches = 0;

    interactions.forEach(interaction => {
      synthesisIndicators.forEach(pattern => {
        if (pattern.test(interaction.human_input)) {
          matches++;
          if (evidence.length < 3) {
            evidence.push({
              text: interaction.human_input.substring(0, 100),
              timestamp: interaction.timestamp
            });
          }
        }
      });
    });

    return {
      demonstrated: matches >= 2,
      strength: Math.min(matches / 6, 1),
      evidence: evidence
    };
  }

  /**
   * Detect iterative refinement capability
   */
  detectIterativeRefinement(interactions) {
    const refinementIndicators = [
      /\b(refine|improve|better|enhance|iterate|evolve|build.*on)\b/i,
      /\b(version|revision|update|modify|adjust|tweak)\b/i,
      /\b(closer|getting.*there|almost|nearly|progress)\b/i,
      /\b(but.*what.*about|however|although|still.*need)\b/i
    ];

    let evidence = [];
    let matches = 0;

    // Look for progression in conversation
    for (let i = 1; i < interactions.length; i++) {
      const current = interactions[i];
      const previous = interactions[i-1];
      
      refinementIndicators.forEach(pattern => {
        if (pattern.test(current.human_input)) {
          matches++;
          if (evidence.length < 3) {
            evidence.push({
              text: current.human_input.substring(0, 100),
              timestamp: current.timestamp
            });
          }
        }
      });
    }

    return {
      demonstrated: matches >= 2,
      strength: Math.min(matches / 5, 1),
      evidence: evidence
    };
  }

  /**
   * Assess current cognitive state (stuck vs. flowing)
   */
  assessCognitiveState(currentInput, recentInteractions) {
    const stuckIndicators = [
      /\b(stuck|blocked|confused|overwhelmed|frustrated|don't.*know)\b/i,
      /\b(can't|unable|impossible|no.*idea|lost|unclear)\b/i,
      /\b(problem|issue|error|wrong|broken|failing)\b/i,
      /\b(help|what.*should|don't.*understand|explain)\b/i
    ];

    const flowingIndicators = [
      /\b(interesting|curious|wondering|exploring|building.*on)\b/i,
      /\b(what.*if|could.*we|might.*try|let's|excited)\b/i,
      /\b(making.*progress|getting.*there|starting.*to)\b/i,
      /\b(idea|insight|connection|pattern|solution)\b/i
    ];

    let stuckScore = 0;
    let flowingScore = 0;

    // Analyze current input
    stuckIndicators.forEach(pattern => {
      if (pattern.test(currentInput)) stuckScore++;
    });

    flowingIndicators.forEach(pattern => {
      if (pattern.test(currentInput)) flowingScore++;
    });

    // Analyze recent tone
    const recentInputs = recentInteractions.slice(0, 3).map(i => i.human_input).join(' ');
    stuckIndicators.forEach(pattern => {
      if (pattern.test(recentInputs)) stuckScore += 0.5;
    });

    flowingIndicators.forEach(pattern => {
      if (pattern.test(recentInputs)) flowingScore += 0.5;
    });

    const state = stuckScore > flowingScore ? 'stuck' : 
                 flowingScore > stuckScore ? 'flowing' : 'neutral';

    return {
      state: state,
      confidence: Math.abs(stuckScore - flowingScore) / (stuckScore + flowingScore + 1),
      stuckScore: stuckScore,
      flowingScore: flowingScore
    };
  }

  /**
   * Generate recommendations for conversation approach
   */
  generateRecommendations(capabilities, cognitiveState, currentInput) {
    const recommendations = [];

    // If person is stuck but has demonstrated capabilities
    if (cognitiveState.state === 'stuck' && capabilities.length > 0) {
      // Find their strongest capability
      const strongest = capabilities.reduce((max, cap) => 
        cap.strength > max.strength ? cap : max, capabilities[0]);

      if (strongest) {
        recommendations.push({
          type: 'capability_bridge',
          priority: 'high',
          approach: `Remind them of their ${strongest.type} strength and connect it to current challenge`,
          template: `You have a really good track record with ${strongest.description.toLowerCase()}. Given that strength, what does your intuition tell you about this situation?`
        });
      }
    }

    // If person is flowing, amplify momentum
    if (cognitiveState.state === 'flowing') {
      recommendations.push({
        type: 'momentum_amplification',
        priority: 'medium',
        approach: 'Acknowledge the good thinking and build on it',
        template: 'That\'s a sophisticated way of approaching this. Where does that thinking lead you?'
      });
    }

    // If multiple capabilities, suggest synthesis
    if (capabilities.length >= 2) {
      recommendations.push({
        type: 'capability_synthesis',
        priority: 'medium',
        approach: 'Help them see how their different strengths could work together',
        template: `You're bringing together both your ${capabilities[0].type} and ${capabilities[1].type} abilities here. What happens when you combine those perspectives?`
      });
    }

    return recommendations;
  }
}