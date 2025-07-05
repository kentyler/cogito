/**
 * Meeting Role Analyzer
 * Analyzes conversational roles and functions being played dynamically in meetings
 */

export class MeetingRoleAnalyzer {
  constructor() {
    this.conversationBuffer = [];
    this.roleHistory = [];
    
    // Meeting roles to identify
    this.meetingRoles = {
      facilitator: {
        indicators: ['what do others think', 'let\'s move on', 'what should we focus on', 'how does everyone feel'],
        function: 'Guiding flow, managing discussion'
      },
      challenger: {
        indicators: ['but what if', 'i disagree', 'that might not work', 'have we considered', 'what about'],
        function: 'Questioning assumptions, playing devil\'s advocate'
      },
      synthesizer: {
        indicators: ['so what i\'m hearing', 'it sounds like', 'both of you are saying', 'the common thread'],
        function: 'Connecting ideas, finding common ground'
      },
      investigator: {
        indicators: ['why', 'how', 'what if we', 'can you explain', 'what exactly'],
        function: 'Asking probing questions, seeking details'
      },
      supporter: {
        indicators: ['that\'s a great point', 'building on that', 'exactly', 'yes, and', 'i love that'],
        function: 'Building on ideas, encouraging'
      },
      timekeeper: {
        indicators: ['we have x minutes', 'let\'s wrap up', 'moving on', 'we should decide'],
        function: 'Managing pace, keeping focus'
      },
      decision_maker: {
        indicators: ['so we\'re going with', 'let\'s decide', 'the choice is', 'we need to pick'],
        function: 'Moving toward conclusions'
      },
      bridge_builder: {
        indicators: ['from sarah\'s perspective', 'what ken is saying', 'both sides', 'middle ground'],
        function: 'Connecting different viewpoints'
      }
    };
  }
  
  /**
   * Analyze a transcript snippet for meeting roles
   */
  analyzeTranscriptForRoles(transcriptText, speakerContext = 'unknown') {
    const lowerText = transcriptText.toLowerCase();
    const detectedRoles = [];
    
    // Check each role for indicators
    for (const [roleName, roleInfo] of Object.entries(this.meetingRoles)) {
      for (const indicator of roleInfo.indicators) {
        if (lowerText.includes(indicator)) {
          detectedRoles.push({
            role: roleName,
            function: roleInfo.function,
            indicator: indicator,
            confidence: this.calculateRoleConfidence(lowerText, indicator),
            speaker_context: speakerContext
          });
          break; // Only count each role once per turn
        }
      }
    }
    
    // Add to conversation buffer
    this.conversationBuffer.push({
      text: transcriptText,
      speaker_context: speakerContext,
      roles: detectedRoles,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 20 turns
    if (this.conversationBuffer.length > 20) {
      this.conversationBuffer.shift();
    }
    
    return detectedRoles;
  }
  
  /**
   * Generate insights about current meeting dynamics
   */
  generateMeetingInsights() {
    if (this.conversationBuffer.length < 3) {
      return null; // Need some conversation history
    }
    
    const recentTurns = this.conversationBuffer.slice(-10);
    const insights = {
      active_roles: this.getActiveRoles(recentTurns),
      missing_roles: this.getMissingRoles(recentTurns),
      role_dynamics: this.analyzeRoleDynamics(recentTurns),
      suggestions: []
    };
    
    // Generate suggestions based on analysis
    insights.suggestions = this.generateSuggestions(insights);
    
    return insights;
  }
  
  /**
   * Get roles that have been active recently
   */
  getActiveRoles(turns) {
    const roleCount = {};
    
    turns.forEach(turn => {
      turn.roles.forEach(role => {
        if (!roleCount[role.role]) {
          roleCount[role.role] = 0;
        }
        roleCount[role.role]++;
      });
    });
    
    return Object.entries(roleCount).map(([role, count]) => ({
      role,
      frequency: count,
      function: this.meetingRoles[role]?.function || 'Unknown function'
    }));
  }
  
  /**
   * Identify roles that might be missing
   */
  getMissingRoles(turns) {
    const activeRoles = new Set();
    turns.forEach(turn => {
      turn.roles.forEach(role => activeRoles.add(role.role));
    });
    
    const allRoles = Object.keys(this.meetingRoles);
    const missingRoles = allRoles.filter(role => !activeRoles.has(role));
    
    return missingRoles.map(role => ({
      role,
      function: this.meetingRoles[role].function,
      impact: this.assessMissingRoleImpact(role, turns)
    }));
  }
  
  /**
   * Analyze role transitions and dynamics
   */
  analyzeRoleDynamics(turns) {
    const dynamics = [];
    
    // Look for role conflicts (multiple people in same role)
    const rolesByTurn = turns.map(turn => turn.roles.map(r => r.role));
    
    // Look for role transitions
    for (let i = 1; i < turns.length; i++) {
      const prevRoles = rolesByTurn[i-1];
      const currRoles = rolesByTurn[i];
      
      if (prevRoles.length > 0 && currRoles.length > 0) {
        const transition = {
          from: prevRoles,
          to: currRoles,
          type: this.classifyTransition(prevRoles, currRoles)
        };
        dynamics.push(transition);
      }
    }
    
    return dynamics;
  }
  
  /**
   * Generate actionable suggestions
   */
  generateSuggestions(insights) {
    const suggestions = [];
    
    // Check for missing facilitator
    if (insights.missing_roles.some(r => r.role === 'facilitator')) {
      suggestions.push({
        type: 'missing_role',
        role: 'facilitator',
        suggestion: 'Discussion might benefit from someone taking on facilitation - guiding the flow and checking for input from everyone.'
      });
    }
    
    // Check for too many challengers
    const challengerCount = insights.active_roles.find(r => r.role === 'challenger')?.frequency || 0;
    if (challengerCount > 3) {
      suggestions.push({
        type: 'role_balance',
        role: 'challenger',
        suggestion: 'Lots of challenging happening - might be helpful for someone to play synthesizer or supporter to balance the energy.'
      });
    }
    
    // Check for missing synthesizer in complex discussions
    if (insights.active_roles.length > 4 && !insights.active_roles.some(r => r.role === 'synthesizer')) {
      suggestions.push({
        type: 'complexity_management',
        role: 'synthesizer',
        suggestion: 'With many perspectives emerging, someone could help by synthesizing common themes or bridges between viewpoints.'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Calculate confidence for role detection
   */
  calculateRoleConfidence(text, indicator) {
    const textLength = text.length;
    const indicatorStrength = indicator.length / textLength;
    return Math.min(0.9, 0.3 + indicatorStrength * 2);
  }
  
  /**
   * Assess impact of missing role
   */
  assessMissingRoleImpact(role, turns) {
    // Simple heuristic - could be more sophisticated
    const criticalRoles = ['facilitator', 'synthesizer', 'decision_maker'];
    return criticalRoles.includes(role) ? 'high' : 'medium';
  }
  
  /**
   * Classify transition between role sets
   */
  classifyTransition(prevRoles, currRoles) {
    if (prevRoles.includes('challenger') && currRoles.includes('synthesizer')) {
      return 'productive_shift';
    }
    if (prevRoles.includes('investigator') && currRoles.includes('decision_maker')) {
      return 'closing_shift';
    }
    return 'normal_flow';
  }
  
  /**
   * Get formatted insight for display
   */
  getFormattedInsight() {
    const insights = this.generateMeetingInsights();
    if (!insights) return null;
    
    let insight = '';
    
    // Active roles summary
    if (insights.active_roles.length > 0) {
      const topRoles = insights.active_roles.slice(0, 2);
      insight += `Active meeting functions: ${topRoles.map(r => r.role).join(', ')}. `;
    }
    
    // Most important suggestion
    if (insights.suggestions.length > 0) {
      insight += insights.suggestions[0].suggestion;
    }
    
    return insight || null;
  }
}