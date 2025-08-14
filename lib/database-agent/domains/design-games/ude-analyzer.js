/**
 * Design Games - UDE Analysis Operations
 */

// Available methods: client_id field usage verified in database schema
export default class UDEAnalyzer {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Find games with similar UDEs using basic text similarity
   */
  async findSimilarUDEs(clientId, currentUDE, limit = 5) {
    // Schema verified: client_id field confirmed in games.client_games table
    const query = `
      SELECT 
        name as game_name,
        game_data->>'ude' as ude,
        COALESCE(jsonb_array_length(COALESCE(game_data->'hands', '[]'::jsonb)), 0) as hands_played,
        created_at
      FROM games.client_games 
      WHERE client_id = $1 
        AND game_data->>'ude' IS NOT NULL
        AND game_data->>'ude' != $2
      ORDER BY created_at DESC
    `;

    const result = await this.connector.query(query, [clientId, currentUDE]);
    
    // Simple similarity scoring based on word overlap
    const currentWords = new Set(
      currentUDE.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    );
    
    const scoredUDEs = result.rows.map(row => {
      const udeWords = new Set(
        row.ude.toLowerCase().split(/\s+/).filter(word => word.length > 2)
      );
      
      const intersection = new Set([...currentWords].filter(x => udeWords.has(x)));
      const union = new Set([...currentWords, ...udeWords]);
      const similarity = intersection.size / union.size;
      
      return {
        ...row,
        similarity_score: similarity
      };
    });

    return scoredUDEs
      .filter(item => item.similarity_score > 0)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
  }
}