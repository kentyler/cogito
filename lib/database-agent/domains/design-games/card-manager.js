/**
 * Design Games - Card Management Operations
 */

// Schema verified: games.client_games table confirmed with client_id field
export default class CardManager {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get all cards across all games for a client
   */
  async getAllCards(clientId) {
    const query = `
      SELECT 
        name as game_name,
        game_data->'cards' as cards
      FROM games.client_games 
      WHERE client_id = $1 AND game_data ? 'cards'
    `;

    const result = await this.connector.query(query, [clientId]);
    return result.rows.flatMap(row => {
      const cards = row.cards || {};
      return Object.entries(cards).map(([key, value]) => ({
        game_name: row.game_name,
        card_key: key,
        card_value: value
      }));
    });
  }

  /**
   * Find cards matching search terms
   */
  async findCards(clientId, searchTerm) {
    const allCards = await this.getAllCards(clientId);
    const searchLower = searchTerm.toLowerCase();
    
    return allCards.filter(card => {
      const cardText = JSON.stringify(card.card_value).toLowerCase();
      return cardText.includes(searchLower) || 
             card.card_key.toLowerCase().includes(searchLower);
    });
  }

  /**
   * Add new cards to an existing game
   */
  async addCards(clientId, gameName, newCards) {
    const game = await this.loadGame(clientId, gameName);
    
    // Merge new cards with existing ones
    const existingCards = game.game_data.cards || {};
    const mergedCards = { ...existingCards, ...newCards };
    
    // Update unplayed cards list
    const newCardKeys = Object.keys(newCards);
    const existingUnplayed = game.game_data.unplayedCards || [];
    const updatedUnplayed = [...new Set([...existingUnplayed, ...newCardKeys])];
    
    game.game_data.cards = mergedCards;
    game.game_data.unplayedCards = updatedUnplayed;
    game.game_data.lastCardUpdate = new Date().toISOString();
    
    const query = `
      UPDATE games.client_games 
      SET 
        game_data = $1,
        updated_at = NOW()
      WHERE client_id = $2 AND name = $3
      RETURNING id, name, game_data->>'currentStatus' as status
    `;

    const result = await this.connector.query(query, [
      game.game_data,
      clientId, 
      gameName
    ]);

    if (!result.rows[0]) {
      throw new Error(`Game '${gameName}' not found for client ${clientId}`);
    }

    return {
      game: result.rows[0],
      cards: mergedCards,
      addedCards: newCards
    };
  }

  // Helper method that card-manager needs from game-manager
  async loadGame(clientId, gameName) {
    const query = `
      SELECT id, name, status, game_data, created_at, updated_at
      FROM games.client_games 
      WHERE client_id = $1 AND name = $2
    `;

    const result = await this.connector.query(query, [clientId, gameName]);
    if (!result.rows[0]) {
      throw new Error(`Game '${gameName}' not found for client ${clientId}`);
    }

    return result.rows[0];
  }
}