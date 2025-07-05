/**
 * Upgrade Detection System
 * 
 * Monitors cognitive-simple personality for signs that it needs
 * multi-personality coordination, then proposes upgrade organically.
 */

export class UpgradeDetector {
  constructor(db, simplePersonality) {
    this.db = db;
    this.simplePersonality = simplePersonality;
    this.monitoring = false;
    this.indicators = {
      conflictingRequests: 0,
      domainSwitchingFrequency: 0,
      evaporationOpportunities: 0,
      liminalObservationsBacklog: 0
    };
  }

  /**
   * Start monitoring simple personality for upgrade signals
   */
  startMonitoring(collaborator) {
    this.collaborator = collaborator;
    this.monitoring = true;
    
    // Initialize or load existing complexity indicators
    this.loadComplexityIndicators();
    
    console.log('🔍 Upgrade detection monitoring started');
  }

  /**
   * Analyze an interaction for upgrade signals
   */
  async analyzeInteraction(input, response, context) {
    if (!this.monitoring) return;

    // Detect conflicting personality requirements
    const conflicts = await this.detectPersonalityConflicts(input);
    if (conflicts.length > 0) {
      this.indicators.conflictingRequests += conflicts.length;
    }

    // Detect rapid domain switching
    const domainSwitch = await this.detectDomainSwitching(input, context);
    if (domainSwitch) {
      this.indicators.domainSwitchingFrequency += 1;
    }

    // Detect potential evaporation opportunities
    const evaporationOpps = await this.detectEvaporationOpportunities(input, response);
    if (evaporationOpps.length > 0) {
      this.indicators.evaporationOpportunities += evaporationOpps.length;
    }

    // Detect when simple personality is struggling with complexity
    const liminalBacklog = await this.detectLiminalBacklog(input, response);
    if (liminalBacklog) {
      this.indicators.liminalObservationsBacklog += 1;
    }

    // Update database
    await this.updateComplexityIndicators();

    // Check if upgrade threshold reached
    if (await this.shouldProposeUpgrade()) {
      await this.proposeUpgrade();
    }
  }

  /**
   * Detect conflicting personality requirements in single request
   */
  async detectPersonalityConflicts(input) {
    const conflicts = [];
    
    // Look for mixed signals
    const patterns = {
      formal_informal: [/\b(professional|formal|official)\b/i, /\b(casual|funny|relaxed)\b/i],
      technical_creative: [/\b(technical|precise|accurate)\b/i, /\b(creative|engaging|narrative)\b/i],
      brief_detailed: [/\b(brief|concise|summary)\b/i, /\b(detailed|comprehensive|thorough)\b/i],
      logical_intuitive: [/\b(logical|rational|systematic)\b/i, /\b(intuitive|feeling|philosophical)\b/i]
    };

    for (const [conflictType, [pattern1, pattern2]] of Object.entries(patterns)) {
      if (pattern1.test(input) && pattern2.test(input)) {
        conflicts.push({
          type: conflictType,
          evidence: input,
          severity: this.assessConflictSeverity(input, pattern1, pattern2)
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect rapid switching between different domains
   */
  async detectDomainSwitching(input, context) {
    const domains = {
      writing: /\b(write|post|blog|article|content|story)\b/i,
      coding: /\b(code|debug|function|programming|implement)\b/i,
      research: /\b(analyze|research|investigate|study|compare)\b/i,
      philosophy: /\b(why|meaning|consciousness|philosophical|meta)\b/i
    };

    const currentDomains = [];
    for (const [domain, pattern] of Object.entries(domains)) {
      if (pattern.test(input)) {
        currentDomains.push(domain);
      }
    }

    // Multiple domains in single request suggests need for coordination
    return currentDomains.length > 1;
  }

  /**
   * Detect opportunities for evaporating cloud resolution
   */
  async detectEvaporationOpportunities(input, response) {
    const opportunities = [];

    // Look for either/or language
    const eitherOrPattern = /\b(either|or|versus|vs|instead of|rather than)\b/i;
    if (eitherOrPattern.test(input)) {
      opportunities.push({
        type: 'false_dichotomy',
        evidence: input
      });
    }

    // Look for compromise language in response
    const compromisePattern = /\b(compromise|balance|trade.?off|middle ground)\b/i;
    if (compromisePattern.test(response)) {
      opportunities.push({
        type: 'compromise_response',
        evidence: response
      });
    }

    // Look for "but" statements indicating tension
    const tensionPattern = /\bbut\b.*\bbut\b/i;
    if (tensionPattern.test(input + ' ' + response)) {
      opportunities.push({
        type: 'multiple_tensions',
        evidence: input
      });
    }

    return opportunities;
  }

  /**
   * Detect when simple personality is missing liminal observations
   */
  async detectLiminalBacklog(input, response) {
    // Look for signs that important questions aren't being asked
    const liminalSignals = [
      // Meta-questions not explored
      input.includes('how') && !response.includes('why'),
      // Assumptions not challenged
      input.includes('should') && !response.includes('what if'),
      // Patterns not noticed
      input.includes('always') && !response.includes('except'),
      // Edges not explored
      response.length > 500 && !response.includes('?') // No questions in long response
    ];

    return liminalSignals.filter(signal => signal).length > 1;
  }

  /**
   * Check if we should propose upgrade
   */
  async shouldProposeUpgrade() {
    const thresholds = {
      conflictingRequests: 3,
      domainSwitchingFrequency: 5,
      evaporationOpportunities: 4,
      liminalObservationsBacklog: 6
    };

    // Check if multiple indicators exceed thresholds
    const exceededThresholds = Object.entries(thresholds)
      .filter(([indicator, threshold]) => this.indicators[indicator] >= threshold);

    return exceededThresholds.length >= 2;
  }

  /**
   * Propose upgrade to multi-personality system
   */
  async proposeUpgrade() {
    const evidence = this.buildUpgradeEvidence();
    
    const proposal = {
      aspect: 'architecture',
      reasoning: `Complexity indicators suggest need for multi-personality coordination: ${evidence}`,
      change: 'Upgrade to cogito-multi with federated personality management',
      benefits: [
        'Better handling of conflicting requirements through evaporating cloud resolution',
        'Specialized personalities for different domains (writer, coder, researcher, liminal)',
        'Improved synthesis of diverse perspectives',
        'Enhanced philosophical and meta-cognitive awareness'
      ],
      risks: [
        'Increased system complexity',
        'Database dependency',
        'Learning curve for new capabilities'
      ]
    };

    // Use simple personality's evolution system to propose
    await this.simplePersonality.proposePersonalityEvolution(
      proposal.aspect,
      proposal.change,
      proposal.reasoning,
      `Upgrade detection triggered: ${evidence}`
    );

    // Mark upgrade as proposed
    await this.db.query(`
      UPDATE complexity_indicators 
      SET upgrade_proposed = 1
      WHERE collaborator = ?
    `, [this.collaborator]);

    console.log('🚀 Upgrade to cogito-multi proposed based on complexity analysis');
    
    return proposal;
  }

  /**
   * Build evidence string for upgrade proposal
   */
  buildUpgradeEvidence() {
    const evidence = [];
    
    if (this.indicators.conflictingRequests > 0) {
      evidence.push(`${this.indicators.conflictingRequests} conflicting personality requirements`);
    }
    if (this.indicators.domainSwitchingFrequency > 0) {
      evidence.push(`${this.indicators.domainSwitchingFrequency} rapid domain switches`);
    }
    if (this.indicators.evaporationOpportunities > 0) {
      evidence.push(`${this.indicators.evaporationOpportunities} missed synthesis opportunities`);
    }
    if (this.indicators.liminalObservationsBacklog > 0) {
      evidence.push(`${this.indicators.liminalObservationsBacklog} unexamined assumptions`);
    }
    
    return evidence.join(', ');
  }

  /**
   * Load existing complexity indicators from database
   */
  async loadComplexityIndicators() {
    try {
      const existing = await this.db.getComplexityIndicators(this.collaborator);
      if (existing) {
        this.indicators = {
          conflictingRequests: existing.conflicting_requests || 0,
          domainSwitchingFrequency: existing.domain_switches_per_session || 0,
          evaporationOpportunities: existing.evaporation_opportunities || 0,
          liminalObservationsBacklog: existing.liminal_observations_backlog || 0
        };
      }
    } catch (error) {
      console.log('No existing complexity indicators found, starting fresh');
    }
  }

  /**
   * Update complexity indicators in database
   */
  async updateComplexityIndicators() {
    await this.db.updateComplexityIndicators(this.collaborator, {
      conflictingRequests: 1, // increment
      domainSwitchesPerSession: this.indicators.domainSwitchingFrequency,
      evaporationOpportunities: 1, // increment
      liminalObservationsBacklog: 1 // increment
    });
  }

  /**
   * Assess severity of detected conflict
   */
  assessConflictSeverity(input, pattern1, pattern2) {
    // Simple heuristic - closer together in text = higher severity
    const text = input.toLowerCase();
    const match1 = text.search(pattern1);
    const match2 = text.search(pattern2);
    
    if (match1 !== -1 && match2 !== -1) {
      const distance = Math.abs(match1 - match2);
      return distance < 50 ? 'high' : distance < 100 ? 'medium' : 'low';
    }
    
    return 'low';
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoring = false;
    console.log('🔍 Upgrade detection monitoring stopped');
  }
}