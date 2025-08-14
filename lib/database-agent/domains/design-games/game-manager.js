/**
 * Design Games - Game Management Operations
 */

// Schema verified: games.client_games table confirmed with client_id field
export default class GameManager {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Create a new design game for a client
   */
  async createGame(clientId, name, ude, initialCards = {}) {
    const gameData = {
      ude,
      started: new Date().toISOString(),
      totalSessions: 0,
      cards: initialCards,
      hands: [],
      currentStatus: "Game created",
      unplayedCards: Object.keys(initialCards)
    };

    const query = `
      INSERT INTO games.client_games (client_id, name, game_data)
      VALUES ($1, $2, $3)
      RETURNING id, name, status, created_at
    `;

    const result = await this.connector.query(query, [clientId, name, gameData]);
    return result.rows[0];
  }

  /**
   * Load a specific game for a client
   */
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

  /**
   * List all games for a client
   */
  async listGames(clientId, status = null) {
    let query = `
      SELECT 
        id, 
        name, 
        status,
        game_data->>'ude' as ude,
        game_data->>'currentStatus' as current_status,
        (game_data->>'totalSessions')::int as total_sessions,
        COALESCE(jsonb_array_length(COALESCE(game_data->'hands', '[]'::jsonb)), 0) as hands_played,
        created_at,
        updated_at
      FROM games.client_games 
      WHERE client_id = $1
    `;

    const queryParams = [clientId];
    if (status) {
      query += ` AND status = $2`;
      queryParams.push(status);
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await this.connector.query(query, queryParams);
    return result.rows;
  }

  /**
   * Update game status
   */
  async updateGameStatus(clientId, gameName, status, statusMessage = null) {
    const game = await this.loadGame(clientId, gameName);
    
    game.game_data.currentStatus = statusMessage || status;
    game.game_data.lastStatusUpdate = new Date().toISOString();
    
    const query = `
      UPDATE games.client_games 
      SET 
        status = $1,
        game_data = $2,
        updated_at = NOW()
      WHERE client_id = $3 AND name = $4
      RETURNING id, name, status, updated_at
    `;

    const result = await this.connector.query(query, [
      status, 
      game.game_data, 
      clientId, 
      gameName
    ]);

    if (!result.rows[0]) {
      throw new Error(`Game '${gameName}' not found for client ${clientId}`);
    }

    return result.rows[0];
  }
}