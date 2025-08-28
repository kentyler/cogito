/**
 * Session Manager - Manages game state for individual sessions
 */

export class SessionManager {
  constructor(options = {}) {
    this.sessionState = new Map(); // sessionId -> gameState
    this.turnsSinceLastCheck = new Map(); // sessionId -> turn count
    this.checkInterval = options.checkInterval || 5; // Alert every N turns if no state
  }

  /**
   * Update session state based on detection results
   * @param {string} sessionId - Session identifier
   * @param {Object} stateDetection - State detection result
   */
  updateSessionState(sessionId, stateDetection) {
    if (stateDetection.declared) {
      this.sessionState.set(sessionId, stateDetection.state);
      this.turnsSinceLastCheck.set(sessionId, 0);
    }
  }

  /**
   * Increment turn counter for session
   * @param {string} sessionId - Session identifier
   * @returns {number} Current turn count
   */
  incrementTurnCount(sessionId) {
    const turnCount = (this.turnsSinceLastCheck.get(sessionId) || 0) + 1;
    this.turnsSinceLastCheck.set(sessionId, turnCount);
    return turnCount;
  }

  /**
   * Check if session needs state declaration prompt
   * @param {string} sessionId - Session identifier
   * @param {number} turnCount - Current turn count
   * @returns {Object|null} Prompt info or null
   */
  checkForStatePrompt(sessionId, turnCount) {
    const currentState = this.sessionState.get(sessionId);
    
    if (!currentState && turnCount >= this.checkInterval) {
      this.turnsSinceLastCheck.set(sessionId, 0); // Reset counter after prompting
      
      return {
        needsStateDeclaration: true,
        turnsSinceStart: turnCount,
        message: `🎯 Game State Check: We've been working for ${turnCount} turns without declaring our approach. Are we:\n` +
                `• Playing a specific design game? (e.g., "let's start the button styling game")\n` +
                `• Working in unidentified mode? (e.g., "we're exploring without a specific game")`
      };
    }

    return null;
  }

  /**
   * Get current game state for a session
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Current state or null
   */
  getSessionState(sessionId) {
    return this.sessionState.get(sessionId) || null;
  }

  /**
   * Get turn count for session
   * @param {string} sessionId - Session identifier
   * @returns {number} Turn count
   */
  getTurnCount(sessionId) {
    return this.turnsSinceLastCheck.get(sessionId) || 0;
  }

  /**
   * Clear session state (useful when session ends)
   * @param {string} sessionId - Session identifier
   */
  clearSession(sessionId) {
    this.sessionState.delete(sessionId);
    this.turnsSinceLastCheck.delete(sessionId);
  }

  /**
   * Get session statistics
   * @returns {Object} Current stats
   */
  getStats() {
    return {
      activeSessions: this.sessionState.size,
      sessionStates: Array.from(this.sessionState.entries()).map(([id, state]) => ({
        sessionId: id.substring(0, 8) + '...', // Truncate for privacy
        type: state.type,
        gameName: state.gameName || null
      }))
    };
  }
}