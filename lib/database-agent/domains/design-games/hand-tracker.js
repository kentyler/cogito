/**
 * Design Games - Hand Tracking Operations
 */

// Schema verified: games.client_games table confirmed with client_id field
export default class HandTracker {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Record a hand played in the game
   */
  async recordHand(clientId, gameName, cards, outcome, notes = null) {
    const game = await this.loadGame(clientId, gameName);
    
    const hand = {
      id: Date.now().toString(),
      cards,
      outcome,
      notes,
      timestamp: new Date().toISOString(),
      session: game.game_data.totalSessions || 0
    };

    // Update game data
    const hands = game.game_data.hands || [];
    hands.push(hand);
    
    // Update unplayed cards (remove played ones)
    const playedCardKeys = Array.isArray(cards) ? cards : Object.keys(cards);
    const unplayedCards = (game.game_data.unplayedCards || []).filter(
      cardKey => !playedCardKeys.includes(cardKey)
    );
    
    game.game_data.hands = hands;
    game.game_data.unplayedCards = unplayedCards;
    game.game_data.totalSessions = (game.game_data.totalSessions || 0) + 1;
    game.game_data.lastHandPlayed = new Date().toISOString();
    
    // Update status based on outcome
    if (outcome === 'success' || outcome === 'win') {
      game.game_data.currentStatus = `Successful hand played: ${playedCardKeys.join(', ')}`;
    } else {
      game.game_data.currentStatus = `Hand attempted: ${outcome}`;
    }

    const query = `
      UPDATE games.client_games 
      SET 
        game_data = $1,
        updated_at = NOW()
      WHERE client_id = $2 AND name = $3
      RETURNING id, name, game_data
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
      hand,
      remainingUnplayedCards: unplayedCards.length
    };
  }

  /**
   * Get successful card combinations across all games
   */
  async getSuccessfulCombinations(clientId) {
    const query = `
      SELECT 
        name as game_name,
        game_data->'hands' as hands,
        game_data->>'ude' as ude
      FROM games.client_games 
      WHERE client_id = $1 AND game_data ? 'hands'
    `;

    const result = await this.connector.query(query, [clientId]);
    const successfulCombinations = [];

    result.rows.forEach(row => {
      const hands = row.hands || [];
      hands.forEach(hand => {
        if (hand.outcome === 'success' || hand.outcome === 'win') {
          successfulCombinations.push({
            game: row.game_name,
            ude: row.ude,
            cards: hand.cards,
            outcome: hand.outcome,
            notes: hand.notes,
            timestamp: hand.timestamp
          });
        }
      });
    });

    return successfulCombinations.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  // Helper method needed by hand-tracker
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