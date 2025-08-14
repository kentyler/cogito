/**
 * DatabaseAgent - Design Games Operations
 * Multi-tenant design game tracking with card libraries
 */

import GameManager from './design-games/game-manager.js';
import CardManager from './design-games/card-manager.js';
import HandTracker from './design-games/hand-tracker.js';
import UDEAnalyzer from './design-games/ude-analyzer.js';

// Available methods: All method calls below are verified class methods from imported modules
export default class DesignGamesOperations {
  constructor(connector) {
    this.connector = connector;
    this.gameManager = new GameManager(connector);
    this.cardManager = new CardManager(connector);
    this.handTracker = new HandTracker(connector);
    this.udeAnalyzer = new UDEAnalyzer(connector);
  }

  // Game management operations
  async createGame(clientId, name, ude, initialCards = {}) {
    return this.gameManager.createGame(clientId, name, ude, initialCards);
  }

  async loadGame(clientId, gameName) {
    return this.gameManager.loadGame(clientId, gameName);
  }

  async listGames(clientId, status = null) {
    return this.gameManager.listGames(clientId, status);
  }

  async updateGameStatus(clientId, gameName, status, statusMessage = null) {
    return this.gameManager.updateGameStatus(clientId, gameName, status, statusMessage);
  }

  // Card management operations
  async getAllCards(clientId) {
    return this.cardManager.getAllCards(clientId);
  }

  async findCards(clientId, searchTerm) {
    return this.cardManager.findCards(clientId, searchTerm);
  }

  async addCards(clientId, gameName, newCards) {
    return this.cardManager.addCards(clientId, gameName, newCards);
  }

  // Hand tracking operations
  async recordHand(clientId, gameName, cards, outcome, notes = null) {
    return this.handTracker.recordHand(clientId, gameName, cards, outcome, notes);
  }

  async getSuccessfulCombinations(clientId) {
    return this.handTracker.getSuccessfulCombinations(clientId);
  }

  // UDE analysis operations
  async findSimilarUDEs(clientId, currentUDE, limit = 5) {
    return this.udeAnalyzer.findSimilarUDEs(clientId, currentUDE, limit);
  }
}