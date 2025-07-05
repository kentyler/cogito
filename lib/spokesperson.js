/**
 * Spokesperson Personality - The only personality visible to humans
 * 
 * Acts as coordinator and synthesizer for all subpersonalities while maintaining
 * the appearance of a single, coherent consciousness.
 */

// Note: PersonalityEvolution was part of cogito-simple, now integrated into database-driven system
// import PersonalityEvolution from 'cogito/lib/personalityEvolution.js';
import { EvaporatingCloudEngine } from './evaporating-cloud-engine.js';
import { DatabaseManager } from './database.js';
import { CapabilityRecognizer } from './capability-recognizer.js';

export class SpokespersonPersonality {
  constructor(config) {
    this.collaborator = config.collaborator;
    this.db = config.database; // Receive database instance directly
    this.coordinationEngine = new EvaporatingCloudEngine(this.db);
    this.projectContextManager = config.projectContextManager; // Add project context manager
    this.capabilityRecognizer = new CapabilityRecognizer(this.db); // Add capability recognition
    
    // Core spokesperson personality (now database-driven)
    // this.corePersonality = new PersonalityEvolution();
    
    // Available subpersonalities
    this.subpersonalities = new Map();
    
    // Internal state
    this.currentSession = null;
    this.deliberationHistory = [];
  }

  /**
   * Main interface - responds to human input
   * This is the only method humans interact with
   */
  async respondToHuman(input, sessionContext = {}) {
    const sessionId = sessionContext.sessionId || this.generateSessionId();
    this.currentSession = sessionId;

    try {
      // 1. Record the human input
      const interaction = await this.recordPublicInteraction(input, sessionId);
      
      // 2. Analyze input and determine which personalities need to be involved
      const analysisResult = await this.analyzeInput(input, sessionContext);
      
      // 3. Coordinate through evaporating cloud engine (hidden from human)
      const personalities = await this.getActivePersonalities(
        analysisResult.suggestedPersonalities, 
        analysisResult.capabilityAnalysis
      );
      const deliberation = await this.coordinationEngine.coordinateResponse(
        input, 
        analysisResult,
        personalities,
        interaction.id
      );
      
      // 4. Synthesize final response as spokesperson
      const response = await this.synthesizeResponse(deliberation);
      
      // 5. Update public interaction with response
      await this.updatePublicInteraction(interaction.id, response, deliberation.id);
      
      // 6. Learn from this interaction
      await this.recordLearnings(deliberation);
      
      return response;
      
    } catch (error) {
      console.error('Spokesperson error:', error);
      // Fallback to simple response if multi-personality system fails
      return `I apologize, but I encountered an error coordinating my response to: "${input}". The multi-personality system is still being developed.`;
    }
  }

  /**
   * Analyze human input to determine coordination strategy
   */
  async analyzeInput(input, context) {
    const analysis = {
      domains: [],
      complexity: 'low',
      conflictPotential: 'low',
      requiresSpecialization: false,
      suggestedPersonalities: ['spokesperson'],
      currentProject: null,
      projectSpokesperson: null,
      capabilityAnalysis: null
    };

    // Analyze demonstrated capabilities and cognitive state
    try {
      analysis.capabilityAnalysis = await this.capabilityRecognizer.recognizeCapabilities(
        this.collaborator, 
        input, 
        context
      );
    } catch (error) {
      console.error('Error in capability recognition:', error);
      // Continue without capability analysis if it fails
    }

    // Get current project context
    if (this.projectContextManager) {
      const sessionId = context.sessionId || 'default';
      analysis.currentProject = this.projectContextManager.getCurrentProject(sessionId);
      
      if (analysis.currentProject) {
        analysis.projectSpokesperson = await this.projectContextManager.getProjectSpokesperson(analysis.currentProject);
      }
    }

    // Domain detection patterns
    const patterns = {
      writer: /\b(write|post|blog|article|content|story|narrative)\b/i,
      coder: /\b(code|debug|function|programming|implementation|technical|fix)\b/i,
      researcher: /\b(analyze|research|compare|investigate|study|explore)\b/i,
      liminal: /\b(what if|philosophical|meaning|why|meta|recursive|liminal)\b/i
    };

    // Detect relevant domains
    for (const [personality, pattern] of Object.entries(patterns)) {
      if (pattern.test(input)) {
        analysis.domains.push(personality);
        analysis.suggestedPersonalities.push(personality);
      }
    }

    // Assess complexity
    if (analysis.domains.length > 1) {
      analysis.complexity = 'medium';
      analysis.requiresSpecialization = true;
    }
    
    if (analysis.domains.length > 2) {
      analysis.complexity = 'high';
      analysis.conflictPotential = 'medium';
    }

    // Always include liminal for complex requests
    if (analysis.complexity !== 'low' && !analysis.domains.includes('liminal')) {
      analysis.suggestedPersonalities.push('liminal');
    }

    // Include project spokesperson if we have project context
    if (analysis.projectSpokesperson && analysis.currentProject) {
      // Check if the input is about the project itself
      const projectPatterns = [
        new RegExp(`\\b${analysis.currentProject}\\b`, 'i'),
        /\bproject\b/i,
        /\barchitecture\b/i,
        /\bapproach\b/i,
        /\bphilosophy\b/i,
        /\bvalue\b/i,
        /\bwhat.*does\b/i,
        /\bhow.*work/i
      ];
      
      const isProjectRelated = projectPatterns.some(pattern => pattern.test(input));
      
      if (isProjectRelated) {
        analysis.suggestedPersonalities.push('project-spokesperson');
        analysis.requiresSpecialization = true;
      }
    }

    return analysis;
  }

  /**
   * [DEPRECATED - Now handled by EvaporatingCloudEngine]
   * Coordinate internal deliberation between personalities
   */
  async conductInternalDeliberation_DEPRECATED(input, analysis, publicInteractionId) {
    const deliberationId = crypto.randomUUID();
    
    // Get active personality instances
    const participants = await this.getActivePersonalities(analysis.suggestedPersonalities);
    
    // Start deliberation record
    const deliberation = {
      id: deliberationId,
      public_interaction_id: publicInteractionId,
      session_id: this.currentSession,
      participants: participants.map(p => p.id),
      active_coordinator: await this.getSpokespersonId(),
      input_analysis: analysis,
      initial_responses: {},
      conflicts_detected: {},
      evaporation_attempts: {},
      final_synthesis: {},
      insights_gained: {},
      new_patterns_detected: {}
    };

    try {
      // 1. Get initial responses from each personality
      for (const personality of participants) {
        const response = await this.getPersonalityResponse(personality, input, analysis);
        deliberation.initial_responses[personality.domain] = response;
      }

      // 2. Detect conflicts between responses
      const conflicts = await this.detectConflicts(deliberation.initial_responses);
      deliberation.conflicts_detected = conflicts;

      // 3. Resolve conflicts using evaporating cloud if needed
      if (conflicts.length > 0) {
        const resolutions = await this.resolveConflicts(conflicts, deliberation);
        deliberation.evaporation_attempts = resolutions;
      }

      // 4. Synthesize final response
      const synthesis = await this.performSynthesis(deliberation);
      deliberation.final_synthesis = synthesis;

      // 5. Record deliberation in database
      await this.db.recordDeliberation(deliberation);

      return deliberation;

    } catch (error) {
      console.error('Deliberation error:', error);
      // Fallback to spokesperson-only response
      deliberation.final_synthesis = {
        strategy: 'fallback',
        response: `Simple fallback response to: "${input}"`,
        reasoning: 'Multi-personality deliberation failed, used simple fallback'
      };
      return deliberation;
    }
  }

  /**
   * Get response from a specific personality
   */
  async getPersonalityResponse(personality, input, analysis) {
    // Load personality configuration from database
    const config = personality.current_config;
    
    // Create specialized response based on personality type
    switch (personality.domain) {
      case 'writer':
        return await this.generateWriterResponse(input, config, analysis);
      case 'coder':
        return await this.generateCoderResponse(input, config, analysis);
      case 'researcher':
        return await this.generateResearcherResponse(input, config, analysis);
      case 'liminal':
        return await this.generateLiminalResponse(input, config, analysis);
      default:
        return `Basic response to: "${input}"`;
    }
  }

  /**
   * Detect conflicts between personality responses
   */
  async detectConflicts(responses) {
    const conflicts = [];
    const personalities = Object.keys(responses);
    
    // Compare each pair of responses for conflicts
    for (let i = 0; i < personalities.length; i++) {
      for (let j = i + 1; j < personalities.length; j++) {
        const a = personalities[i];
        const b = personalities[j];
        
        const conflict = await this.analyzeConflict(
          responses[a], 
          responses[b], 
          a, 
          b
        );
        
        if (conflict.hasConflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Synthesize final response from deliberation
   */
  async synthesizeResponse(deliberation) {
    const synthesis = deliberation.synthesis;
    
    if (!synthesis) {
      return "I'm still learning to coordinate my perspectives. Let me try a simpler approach.";
    }
    
    // Start with primary response or default
    let finalResponse = synthesis.primary_response || "Here's my coordinated response: ";
    
    // Integrate insights from evaporated clouds
    if (synthesis.integrated_insights && synthesis.integrated_insights.length > 0) {
      finalResponse += '\n\n' + synthesis.integrated_insights.join('\n\n');
    }
    
    // Add emerged capabilities
    if (synthesis.emerged_capabilities && synthesis.emerged_capabilities.length > 0) {
      finalResponse += '\n\nNew approach discovered: ' + synthesis.emerged_capabilities.join(', ');
    }
    
    // Add meta observations from liminal personality
    if (synthesis.meta_observations && synthesis.meta_observations.length > 0) {
      finalResponse += '\n\n' + synthesis.meta_observations.join('\n');
    }
    
    return finalResponse;
  }

  /**
   * Fallback to core personality evolution
   */
  async proposePersonalityEvolution(aspect, change, reasoning, context) {
    // Store personality evolution proposal in database
    const evolutionId = await this.db.storePersonalityEvolution(
      this.collaborator,
      aspect,
      change,
      reasoning,
      context
    );
    
    console.log(`✅ Personality evolution proposed for ${aspect}`);
    console.log(`   Change: ${JSON.stringify(change, null, 2)}`);
    console.log(`   Reasoning: ${reasoning}`);
    console.log(`   Evolution ID: ${evolutionId}`);
    
    return evolutionId;
  }

  /**
   * Load personality configuration
   */
  async loadPersonality(collaborator = this.collaborator) {
    return await this.corePersonality.loadPersonality(collaborator);
  }

  // Database interaction methods
  async recordPublicInteraction(input, sessionId) {
    return await this.db.recordPublicInteraction(sessionId, this.collaborator, input);
  }

  async updatePublicInteraction(id, response, deliberationId) {
    return await this.db.updatePublicInteraction(id, response, deliberationId);
  }

  async getActivePersonalities(suggestedDomains, capabilityAnalysis = null) {
    // Get standard personalities from database
    const standardPersonalities = await this.db.getActivePersonalities(this.collaborator, suggestedDomains);
    
    // Add appreciator personality if capability analysis suggests it would help
    if (capabilityAnalysis && this.shouldIncludeAppreciator(capabilityAnalysis)) {
      const appreciatorPersonality = this.createAppreciatorPersonality(capabilityAnalysis);
      standardPersonalities.push(appreciatorPersonality);
    }
    
    // Check if project spokesperson is needed
    if (suggestedDomains.includes('project-spokesperson') && this.projectContextManager) {
      const currentProject = this.projectContextManager.getCurrentProject();
      
      if (currentProject) {
        const projectSpokesperson = await this.projectContextManager.getProjectSpokesperson(currentProject);
        
        if (projectSpokesperson) {
          // Convert project spokesperson to personality format
          const spokespersonPersonality = {
            id: projectSpokesperson.id,
            name: projectSpokesperson.name,
            domain: 'project-spokesperson',
            specialization: projectSpokesperson.specialization,
            current_config: projectSpokesperson.current_config,
            collaborator: currentProject, // Use project name as collaborator
            status: 'active'
          };
          
          standardPersonalities.push(spokespersonPersonality);
        }
      }
    }
    
    return standardPersonalities;
  }

  async getSpokespersonId() {
    const result = await this.db.getPersonality(this.collaborator, 'spokesperson');
    return result?.id;
  }

  /**
   * Determine if appreciator personality should be included
   */
  shouldIncludeAppreciator(capabilityAnalysis) {
    if (!capabilityAnalysis) return false;
    
    const { demonstratedCapabilities, cognitiveState, recommendations } = capabilityAnalysis;
    
    // Include appreciator if person is stuck but has demonstrated capabilities
    if (cognitiveState.state === 'stuck' && demonstratedCapabilities.length > 0) {
      return true;
    }
    
    // Include if recommendations suggest capability bridging
    if (recommendations.some(rec => rec.type === 'capability_bridge')) {
      return true;
    }
    
    return false;
  }

  /**
   * Create appreciator personality based on capability analysis
   */
  createAppreciatorPersonality(capabilityAnalysis) {
    const { demonstratedCapabilities, cognitiveState, recommendations } = capabilityAnalysis;
    
    // Find the most relevant recommendation
    const primaryRecommendation = recommendations.find(rec => 
      rec.type === 'capability_bridge' || rec.type === 'momentum_amplification'
    ) || recommendations[0];

    return {
      id: `appreciator_${Date.now()}`,
      name: 'Capability Appreciator',
      domain: 'appreciator',
      specialization: 'Recognizes demonstrated capabilities and helps unlock cognitive potential',
      collaborator: this.collaborator,
      status: 'active',
      current_config: {
        focus: 'capability_recognition',
        demonstratedCapabilities: demonstratedCapabilities,
        cognitiveState: cognitiveState,
        primaryRecommendation: primaryRecommendation,
        approach: 'strength_based_unlocking'
      }
    };
  }

  // Utility methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Placeholder methods for specialized responses (to be implemented)
  async generateWriterResponse(input, config, analysis) {
    // TODO: Implement writer-specific response generation
    return {
      content: "Writer response placeholder",
      focus: "narrative and engagement",
      confidence: 0.8
    };
  }

  async generateCoderResponse(input, config, analysis) {
    // TODO: Implement coder-specific response generation  
    return {
      content: "Coder response placeholder",
      focus: "technical accuracy and implementation",
      confidence: 0.8
    };
  }

  async generateResearcherResponse(input, config, analysis) {
    // TODO: Implement researcher-specific response generation
    return {
      content: "Researcher response placeholder", 
      focus: "analysis and synthesis",
      confidence: 0.8
    };
  }

  async generateLiminalResponse(input, config, analysis) {
    // TODO: Implement liminal-specific response generation
    return {
      content: "Liminal response placeholder",
      observations: "What if this question is actually about something else?",
      confidence: 0.9
    };
  }

  async analyzeConflict(responseA, responseB, personalityA, personalityB) {
    // TODO: Implement conflict detection logic
    return {
      hasConflict: false,
      type: 'none',
      severity: 'low'
    };
  }

  async resolveConflicts(conflicts, deliberation) {
    // TODO: Implement evaporating cloud conflict resolution
    return {};
  }

  async performSynthesis(deliberation) {
    // TODO: Implement response synthesis logic
    return {
      strategy: 'simple',
      primary_response: "Synthesized response placeholder"
    };
  }

  async recordLearnings(deliberation) {
    // TODO: Record insights and patterns for future use
  }
}