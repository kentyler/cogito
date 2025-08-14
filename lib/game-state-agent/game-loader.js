/**
 * Game Loader - Interface with database for game and card operations
 */

export class GameLoader {
  constructor(databaseAgent) {
    this.databaseAgent = databaseAgent;
  }

  /**
   * Load relevant cards for an identified game
   * @param {number} clientId - Client ID
   * @param {string} gameName - Name of the game
   * @returns {Object|null} Cards or null if game doesn't exist
   */
  async loadGameCards(clientId, gameName) {
    try {
      const game = await this.databaseAgent.designGames.loadGame(clientId, gameName);
      return game.game_data.cards || {};
    } catch (error) {
      // Game doesn't exist yet - that's fine
      return null;
    }
  }

  /**
   * Get available games for a client
   * @param {number} clientId - Client ID
   * @returns {Array} List of available games
   */
  async getAvailableGames(clientId) {
    const games = await this.databaseAgent.designGames.listGames(clientId);
    return games.map(game => ({
      name: game.name,
      ude: game.ude,
      status: game.current_status,
      handsPlayed: game.hands_played || 0
    }));
  }

  /**
   * Find cards that might be relevant to current work
   * @param {number} clientId - Client ID  
   * @param {string} searchTerms - Terms to search for
   * @returns {Array} Relevant cards
   */
  async findRelevantCards(clientId, searchTerms) {
    if (!searchTerms) return [];
    
    const cards = await this.databaseAgent.designGames.findCards(clientId, searchTerms);
    return cards.map(card => ({
      key: card.card_key,
      game: card.game_name,
      pattern: card.card_value.pattern,
      forces: card.card_value.forces,
      suit: card.card_value.suit
    }));
  }
}