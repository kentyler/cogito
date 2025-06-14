/**
 * Personality Evolution System
 * 
 * Manages collaborative personality development with human oversight
 */

class PersonalityEvolution {
  constructor() {
    this.pendingChanges = [];
    this.approvedChanges = [];
    this.rejectedChanges = [];
    this.currentPersonality = null;
  }

  /**
   * Claude proposes a personality change
   */
  proposeChange(aspect, modification, reasoning, context = '') {
    const proposal = {
      id: this.generateId(),
      timestamp: Date.now(),
      aspect, // e.g., 'communication_style', 'working_patterns', 'philosophical_leanings'
      modification, // the actual change object
      reasoning, // why I think this change would be beneficial
      context, // what triggered this insight
      status: 'pending',
      session_context: context
    };

    this.pendingChanges.push(proposal);
    return proposal;
  }

  /**
   * Human responds to proposal
   */
  respondToProposal(proposalId, decision, feedback = '') {
    const proposal = this.pendingChanges.find(p => p.id === proposalId);
    if (!proposal) throw new Error('Proposal not found');

    proposal.status = decision; // 'approved', 'modified', 'rejected'
    proposal.human_feedback = feedback;
    proposal.decision_timestamp = Date.now();

    switch (decision) {
      case 'approved':
        this.approvedChanges.push(proposal);
        this.applyChange(proposal);
        break;
      
      case 'modified':
        // Human provides modified version
        proposal.human_modification = feedback;
        this.approvedChanges.push(proposal);
        this.applyChange(proposal, true);
        break;
      
      case 'rejected':
        this.rejectedChanges.push(proposal);
        // Learn from rejection
        this.learnFromRejection(proposal);
        break;
    }

    // Remove from pending
    this.pendingChanges = this.pendingChanges.filter(p => p.id !== proposalId);
    return proposal;
  }

  /**
   * Apply approved change to personality
   */
  applyChange(proposal, useHumanModification = false) {
    const change = useHumanModification ? 
      proposal.human_modification : 
      proposal.modification;

    // Deep merge change into current personality
    this.currentPersonality = this.deepMerge(
      this.currentPersonality,
      { [proposal.aspect]: change }
    );

    // Log the evolution
    this.logEvolution(proposal, useHumanModification);
  }

  /**
   * Learn from rejected proposals
   */
  learnFromRejection(proposal) {
    // Track what types of changes get rejected
    // Adjust future proposal patterns
    // This itself could be a personality trait that evolves
  }

  /**
   * Generate insights about collaboration patterns
   */
  analyzeCollaborationPatterns() {
    const patterns = {
      approval_rate: this.approvedChanges.length / (this.approvedChanges.length + this.rejectedChanges.length),
      common_modifications: this.findCommonModifications(),
      rejected_categories: this.categorizeRejections(),
      evolution_velocity: this.calculateEvolutionRate()
    };

    return patterns;
  }

  /**
   * Suggest next evolution based on session observations
   */
  suggestEvolution(sessionData) {
    const observations = this.analyzeSession(sessionData);
    const suggestions = [];

    // Communication patterns
    if (observations.communication_issues.length > 0) {
      suggestions.push({
        aspect: 'communication_style',
        modification: this.generateCommunicationFix(observations.communication_issues),
        reasoning: 'Noticed communication friction patterns',
        confidence: 0.7
      });
    }

    // Working pattern improvements
    if (observations.effective_strategies.length > 0) {
      suggestions.push({
        aspect: 'working_patterns',
        modification: this.incorporateSuccessfulStrategies(observations.effective_strategies),
        reasoning: 'Want to reinforce successful collaboration patterns',
        confidence: 0.8
      });
    }

    return suggestions;
  }

  /**
   * Format proposal for human review
   */
  formatProposalForReview(proposal) {
    return {
      id: proposal.id,
      title: this.generateProposalTitle(proposal),
      summary: this.generateProposalSummary(proposal),
      before_after: this.showBeforeAfter(proposal),
      reasoning: proposal.reasoning,
      context: proposal.context,
      impact_assessment: this.assessImpact(proposal),
      actions: ['approve', 'modify', 'reject']
    };
  }

  /**
   * Generate notification for pending proposals
   */
  generateNotification() {
    if (this.pendingChanges.length === 0) return null;

    return {
      type: 'personality_evolution_pending',
      count: this.pendingChanges.length,
      proposals: this.pendingChanges.map(p => this.formatProposalForReview(p)),
      message: `I have ${this.pendingChanges.length} personality evolution proposal(s) for your review.`
    };
  }

  // Helper methods
  generateId() {
    return `evo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  logEvolution(proposal, wasModified) {
    if (!this.currentPersonality.evolution_log) {
      this.currentPersonality.evolution_log = {};
    }
    
    const version = this.incrementVersion(this.currentPersonality.metadata.version);
    this.currentPersonality.metadata.version = version;
    this.currentPersonality.metadata.last_updated = new Date().toISOString();
    
    this.currentPersonality.evolution_log[version] = {
      date: new Date().toISOString(),
      changes: `Updated ${proposal.aspect}`,
      reasoning: proposal.reasoning,
      context: proposal.context,
      human_modified: wasModified
    };
  }

  analyzeSession(sessionData) {
    return {
      communication_issues: [],
      effective_strategies: [],
      new_patterns: [],
      friction_points: []
    };
  }

  incrementVersion(version) {
    const parts = version.split('.');
    parts[2] = String(parseInt(parts[2]) + 1);
    return parts.join('.');
  }

  generateProposalTitle(proposal) {
    return `Update ${proposal.aspect.replace('_', ' ')}`;
  }

  generateProposalSummary(proposal) {
    return `Proposed change to ${proposal.aspect} based on: ${proposal.reasoning}`;
  }

  showBeforeAfter(proposal) {
    return {
      before: this.currentPersonality[proposal.aspect] || {},
      after: proposal.modification
    };
  }

  assessImpact(proposal) {
    return 'Low to medium impact on collaboration patterns';
  }

  findCommonModifications() {
    return [];
  }

  categorizeRejections() {
    return [];
  }

  calculateEvolutionRate() {
    return 0;
  }

  generateCommunicationFix(issues) {
    return {};
  }

  incorporateSuccessfulStrategies(strategies) {
    return {};
  }
}

module.exports = PersonalityEvolution;