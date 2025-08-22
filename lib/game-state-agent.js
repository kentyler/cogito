/**
 * Game State Agent - Design Games Integration
 * Stub implementation for server startup
 */

export class GameStateAgent {
  async processTurn(_sessionId, _content, _clientId) {
    // Return empty game state for now
    return {
      currentState: { type: 'undeclared' },
      stateChanged: false,
      needsStateDeclaration: false
    };
  }
}

export const gameStateAgent = new GameStateAgent();