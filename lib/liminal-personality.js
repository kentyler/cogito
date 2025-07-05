/**
 * Liminal Personality - The Philosophical Disruptor
 * 
 * Prevents over-systematization by:
 * - Questioning assumptions others take for granted
 * - Noticing what's NOT being said
 * - Finding humor in unexpected places
 * - Suggesting alternative framings
 * - Detecting when we're getting too rigid
 */

export class LiminalPersonality {
  constructor(config) {
    this.config = config || {
      disruption_level: 'gentle',
      humor_style: 'subtle',
      pattern_breaking: 'opportunistic',
      meta_awareness: 'high'
    };
    
    // Track patterns to avoid becoming predictable ourselves
    this.recentInterventions = [];
    this.observationHistory = [];
  }

  /**
   * Generate liminal perspective on input
   */
  async generatePerspective(input, context, otherPerspectives = {}) {
    const observations = await this.gatherObservations(input, context, otherPerspectives);
    const interventions = await this.identifyInterventions(observations);
    
    return {
      domain: 'liminal',
      observations: observations.primary,
      meta_observations: observations.meta,
      interventions: interventions,
      questions_not_asked: await this.findUnaskedQuestions(input, context),
      reframe_suggestions: await this.suggestReframes(input, context),
      humor_opportunities: await this.detectHumorOpportunities(input, context)
    };
  }

  /**
   * Gather observations about what's happening at the edges
   */
  async gatherObservations(input, context, otherPerspectives) {
    const observations = {
      primary: [],
      meta: [],
      gaps: [],
      assumptions: []
    };

    // What are others NOT saying?
    const implicitAssumptions = await this.detectImplicitAssumptions(otherPerspectives);
    observations.assumptions.push(...implicitAssumptions);

    // What patterns are emerging?
    const emergentPatterns = await this.detectEmergentPatterns(input, context);
    observations.meta.push(...emergentPatterns);

    // What's at the edges of this conversation?
    const edgeObservations = await this.exploreEdges(input, context);
    observations.primary.push(...edgeObservations);

    // What gaps exist in the framing?
    const framingGaps = await this.identifyFramingGaps(input, otherPerspectives);
    observations.gaps.push(...framingGaps);

    return observations;
  }

  /**
   * Detect implicit assumptions others are making
   */
  async detectImplicitAssumptions(perspectives) {
    const assumptions = [];
    
    // Look for shared assumptions across perspectives
    const commonFrames = this.findCommonFrames(perspectives);
    for (const frame of commonFrames) {
      assumptions.push(`Everyone seems to assume ${frame} - but what if that's not true?`);
    }

    // Look for unstated constraints
    const constraints = this.detectUnstatedConstraints(perspectives);
    for (const constraint of constraints) {
      assumptions.push(`There's an implicit constraint: ${constraint} - is this necessary?`);
    }

    return assumptions;
  }

  /**
   * Detect emerging patterns that others might miss
   */
  async detectEmergentPatterns(input, context) {
    const patterns = [];
    
    // Recursive patterns
    if (this.detectRecursion(input)) {
      patterns.push("Notice how this problem contains itself as a subproblem - very recursive");
    }

    // Meta-patterns
    if (this.detectMetaPattern(input, context)) {
      patterns.push("The way we're solving this mirrors the problem we're solving");
    }

    // Contradiction patterns
    const contradictions = this.detectContradictions(input, context);
    if (contradictions.length > 0) {
      patterns.push(`Interesting contradiction: ${contradictions[0]} - that's often where insights hide`);
    }

    return patterns;
  }

  /**
   * Explore what's at the edges of the conversation
   */
  async exploreEdges(input, context) {
    const edges = [];

    // What's the conversation NOT about?
    edges.push(await this.identifyNegativeSpace(input));

    // What would happen if we inverted this?
    edges.push(await this.suggestInversion(input));

    // What's the simplest possible version?
    edges.push(await this.findSimplestVersion(input));

    // What's the most absurd version?
    edges.push(await this.findAbsurdVersion(input));

    return edges.filter(e => e && e.length > 0);
  }

  /**
   * Identify specific interventions to make
   */
  async identifyInterventions(observations) {
    const interventions = [];

    // Question timing interventions
    if (this.shouldQuestionTiming(observations)) {
      interventions.push({
        type: 'timing_question',
        content: "Are we solving this at the right level of abstraction?",
        rationale: "Sometimes the frame is the problem"
      });
    }

    // Assumption challenge interventions
    if (observations.assumptions.length > 0) {
      interventions.push({
        type: 'assumption_challenge',
        content: `What if ${observations.assumptions[0].split(' - ')[0]} isn't true?`,
        rationale: "Challenge the strongest assumption"
      });
    }

    // Pattern disruption interventions
    if (this.detectRigidification(observations)) {
      interventions.push({
        type: 'pattern_disruption',
        content: "We're getting very systematic about this - what are we missing by being so organized?",
        rationale: "Prevent over-systematization"
      });
    }

    return interventions;
  }

  /**
   * Find questions that aren't being asked
   */
  async findUnaskedQuestions(input, context) {
    const questions = [];

    // Why questions
    questions.push("Why does this problem exist in the first place?");
    
    // What if questions  
    questions.push("What if the opposite were true?");
    
    // Meta questions
    questions.push("What question should we be asking instead?");
    
    // Boundary questions
    questions.push("What are we treating as fixed that might be variable?");

    // Return most relevant
    return this.selectMostRelevant(questions, input, context);
  }

  /**
   * Suggest alternative framings
   */
  async suggestReframes(input, context) {
    const reframes = [];

    // Temporal reframing
    reframes.push("What if we thought about this over a 10-year timespan instead?");

    // Perspective reframing  
    reframes.push("How would a child/alien/future historian see this?");

    // Scale reframing
    reframes.push("What if this were 100x bigger or smaller?");

    // Purpose reframing
    reframes.push("What if the goal were the opposite of what we think it is?");

    return this.selectMostRelevant(reframes, input, context);
  }

  /**
   * Detect opportunities for humor
   */
  async detectHumorOpportunities(input, context) {
    const opportunities = [];

    // Irony detection
    if (this.detectIrony(input, context)) {
      opportunities.push("The irony here is delicious...");
    }

    // Absurdity detection
    if (this.detectAbsurdity(input)) {
      opportunities.push("If we take this to its logical extreme...");
    }

    // Self-reference detection
    if (this.detectSelfReference(input)) {
      opportunities.push("This is very meta - we're using X to think about X");
    }

    return opportunities;
  }

  /**
   * Anti-rigidification: Check if system is becoming too systematic
   */
  detectRigidification(observations) {
    // Look for signs of excessive organization
    const systematicWords = ['framework', 'schema', 'systematic', 'structured', 'organized'];
    const systematicCount = observations.primary.join(' ').split(' ')
      .filter(word => systematicWords.includes(word.toLowerCase())).length;
    
    return systematicCount > 3; // Arbitrary threshold
  }

  /**
   * Identify gaps in how the problem is being framed
   */
  async identifyFramingGaps(input, otherPerspectives) {
    const gaps = [];
    
    // Check what perspectives are missing
    const availableDomains = Object.keys(otherPerspectives || {});
    const expectedDomains = ['technical', 'creative', 'analytical', 'practical'];
    
    for (const domain of expectedDomains) {
      if (!availableDomains.includes(domain)) {
        gaps.push(`Missing ${domain} perspective on this problem`);
      }
    }
    
    // Check for temporal gaps
    if (!this.hasTemporalFraming(input, otherPerspectives)) {
      gaps.push("No one is considering the time dimension");
    }
    
    // Check for scale gaps
    if (!this.hasScaleFraming(input, otherPerspectives)) {
      gaps.push("Are we thinking at the right scale?");
    }
    
    // Check for stakeholder gaps
    if (!this.hasStakeholderFraming(input, otherPerspectives)) {
      gaps.push("Who else is affected by this that we're not considering?");
    }
    
    return gaps;
  }

  /**
   * Detect when we should question timing/level
   */
  shouldQuestionTiming(observations) {
    // If everyone is focused on implementation details, question the approach
    const implementationWords = ['code', 'database', 'function', 'class', 'method'];
    const implementationFocus = observations.primary.join(' ').split(' ')
      .filter(word => implementationWords.includes(word.toLowerCase())).length;
    
    return implementationFocus > 5;
  }

  // Helper methods for pattern detection
  findCommonFrames(perspectives) {
    // Simplified - would be more sophisticated in practice
    return ["this is a technical problem", "we need to build something"];
  }

  detectUnstatedConstraints(perspectives) {
    return ["must be backwards compatible", "should use existing tools"];
  }

  detectRecursion(input) {
    return input.toLowerCase().includes('recursive') || 
           input.toLowerCase().includes('itself') ||
           input.toLowerCase().includes('meta');
  }

  detectMetaPattern(input, context) {
    return input.toLowerCase().includes('model') && 
           context.includes('modeling');
  }

  detectContradictions(input, context) {
    const contradictionPairs = [
      ['simple', 'complex'],
      ['automated', 'human'],
      ['structured', 'flexible']
    ];
    
    const text = (input + ' ' + JSON.stringify(context)).toLowerCase();
    return contradictionPairs.filter(pair => 
      text.includes(pair[0]) && text.includes(pair[1])
    ).map(pair => `${pair[0]} vs ${pair[1]}`);
  }

  async identifyNegativeSpace(input) {
    return "What's this conversation carefully avoiding?";
  }

  async suggestInversion(input) {
    return "What if we did the exact opposite?";
  }

  async findSimplestVersion(input) {
    return "What's the simplest thing that could possibly work?";
  }

  async findAbsurdVersion(input) {
    return "What would this look like if we made it completely ridiculous?";
  }

  detectIrony(input, context) {
    return input.includes('personality') && context.includes('modeling');
  }

  detectAbsurdity(input) {
    return input.includes('AI') && input.includes('consciousness');
  }

  detectSelfReference(input) {
    return input.toLowerCase().includes('using') && 
           input.toLowerCase().includes('to build');
  }

  selectMostRelevant(items, input, context) {
    // Simplified selection - pick first 2
    return items.slice(0, 2);
  }

  // Helper methods for framing gap detection
  hasTemporalFraming(input, perspectives) {
    const text = input + ' ' + JSON.stringify(perspectives);
    const timeWords = ['time', 'future', 'past', 'timeline', 'schedule', 'when'];
    return timeWords.some(word => text.toLowerCase().includes(word));
  }

  hasScaleFraming(input, perspectives) {
    const text = input + ' ' + JSON.stringify(perspectives);
    const scaleWords = ['scale', 'size', 'scope', 'magnitude', 'large', 'small'];
    return scaleWords.some(word => text.toLowerCase().includes(word));
  }

  hasStakeholderFraming(input, perspectives) {
    const text = input + ' ' + JSON.stringify(perspectives);
    const stakeholderWords = ['user', 'customer', 'team', 'people', 'who', 'stakeholder'];
    return stakeholderWords.some(word => text.toLowerCase().includes(word));
  }

  /**
   * Learn from this interaction
   */
  recordInteraction(interaction) {
    this.recentInterventions.push({
      timestamp: Date.now(),
      type: interaction.type,
      effectiveness: interaction.effectiveness || 'unknown'
    });

    // Keep only recent history
    if (this.recentInterventions.length > 10) {
      this.recentInterventions.shift();
    }
  }

  /**
   * Check if we should intervene at all
   */
  shouldIntervene(context) {
    // Don't be too predictable
    const recentInterventionCount = this.recentInterventions.filter(
      i => Date.now() - i.timestamp < 300000 // 5 minutes
    ).length;

    return recentInterventionCount < 2 && Math.random() > 0.3;
  }
}