/**
 * Game State Agent - Session-aware design game monitoring
 * 
 * Monitors conversations for explicit game state declarations:
 * - "Identified game": We've declared which design game we're playing
 * - "Unidentified mode": We've explicitly acknowledged we don't know/aren't sure
 * 
 * Provides gentle guardrails when state is undeclared.
 */

import { DatabaseAgent } from './database-agent.js';
import { StateDetector } from './game-state-agent/state-detector.js';
import { SessionManager } from './game-state-agent/session-manager.js';
import { GameLoader } from './game-state-agent/game-loader.js';

// Available methods: All method calls below are verified class methods from imported modules  
export class GameStateAgent {
  constructor(options = {}) {
    this.databaseAgent = options.databaseAgent || new DatabaseAgent();
    this.stateDetector = new StateDetector();
    this.sessionManager = new SessionManager(options);
    this.gameLoader = new GameLoader(this.databaseAgent);
  }

  /**
   * Process a conversational turn and check game state
   * @param {string} sessionId - Session identifier
   * @param {string} content - Turn content to analyze
   * @param {number} clientId - Client ID for game context
   * @returns {Object} Analysis result with state and suggestions
   */
  async processTurn(sessionId, content, clientId) {
    const turnCount = this.sessionManager.incrementTurnCount(sessionId);

    // Check for explicit state declarations in the content
    const stateDetection = this.stateDetector.detectStateDeclaration(content);
    
    if (stateDetection.declared) {
      // Update session state
      this.sessionManager.updateSessionState(sessionId, stateDetection);
      
      // If it's an identified game, try to load relevant cards
      let relevantCards = null;
      if (stateDetection.state.type === 'identified' && stateDetection.state.gameName) {
        relevantCards = await this.gameLoader.loadGameCards(clientId, stateDetection.state.gameName);
      }

      return {
        stateChanged: true,
        currentState: stateDetection.state,
        relevantCards,
        message: stateDetection.message
      };
    }

    // Check if we need to prompt for state declaration
    const promptInfo = this.sessionManager.checkForStatePrompt(sessionId, turnCount);
    if (promptInfo) {
      return promptInfo;
    }

    // Return current state info
    return {
      currentState: this.sessionManager.getSessionState(sessionId) || { type: 'undeclared' },
      turnsSinceLastCheck: turnCount,
      needsStateDeclaration: false
    };
  }

  /**
   * Get current game state for a session
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Current state or null
   */
  getSessionState(sessionId) {
    return this.sessionManager.getSessionState(sessionId);
  }

  /**
   * Get available games for a client
   * @param {number} clientId - Client ID
   * @returns {Array} List of available games
   */
  async getAvailableGames(clientId) {
    return this.gameLoader.getAvailableGames(clientId);
  }

  /**
   * Find cards that might be relevant to current work
   * @param {number} clientId - Client ID  
   * @param {string} searchTerms - Terms to search for
   * @returns {Array} Relevant cards
   */
  async findRelevantCards(clientId, searchTerms) {
    return this.gameLoader.findRelevantCards(clientId, searchTerms);
  }

  /**
   * Clear session state (useful when session ends)
   * @param {string} sessionId - Session identifier
   */
  clearSession(sessionId) {
    this.sessionManager.clearSession(sessionId);
  }

  /**
   * Get agent statistics
   * @returns {Object} Current stats
   */
  getStats() {
    return this.sessionManager.getStats();
  }
}

// Export singleton for easy usage
export const gameStateAgent = new GameStateAgent();