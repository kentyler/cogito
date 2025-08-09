/**
 * Turn Operations Extended - Semantic search and analytics for turns
 * Handles similarity search, embedding statistics, and advanced queries
 */

export class TurnOperationsExtended {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Find semantically similar turns using vector similarity
   * @param {string} turnId - Target turn ID
   * @param {number} limit - Max results to return
   * @param {number} minSimilarity - Minimum similarity threshold
   * @returns {Array} Similar turns with similarity scores
   */
  async findSimilarTurns(turnId, limit = 10, minSimilarity = 0.7) {
    const query = `
      WITH target_turn AS (
        SELECT content_embedding, meeting_id
        FROM meetings.turns
        WHERE id = $1
        AND content_embedding IS NOT NULL
      ),
      target_meeting AS (
        SELECT client_id
        FROM meetings.meetings m
        JOIN target_turn tt ON m.id = tt.meeting_id
      )
      SELECT 
        t.id,
        t.content,
        t.source_type,
        t.metadata,
        t.timestamp,
        t.client_id,
        m.client_id,
        -- Get the response if this turn has one
        resp.content as response_content,
        1 - (t.content_embedding <=> tt.content_embedding) as similarity
      FROM meetings.turns t
      CROSS JOIN target_turn tt
      JOIN meetings.meetings m ON t.meeting_id = m.id
      CROSS JOIN target_meeting tm
      LEFT JOIN meetings.turns resp ON resp.source_id = t.id AND resp.source_type LIKE '%llm%'
      WHERE t.id != $1
      AND t.content_embedding IS NOT NULL
      AND m.client_id = tm.client_id
      AND 1 - (t.content_embedding <=> tt.content_embedding) >= $3
      ORDER BY similarity DESC
      LIMIT $2
    `;
    
    const result = await this.connector.query(query, [turnId, limit, minSimilarity]);
    return result.rows;
  }

  /**
   * Search turns by semantic similarity to query embedding
   * @param {string} queryEmbedding - Embedding vector as string
   * @param {number} limit - Max results to return
   * @param {number} minSimilarity - Minimum similarity threshold
   * @param {number} clientId - Optional client ID filter
   * @returns {Array} Matching turns with similarity scores
   */
  async searchBySimilarity(queryEmbedding, limit = 20, minSimilarity = 0.5, clientId = null) {
    let query = `
      SELECT 
        t.id,
        t.content,
        t.source_type,
        t.metadata,
        t.timestamp,
        t.meeting_id,
        1 - (t.content_embedding <=> $1::vector) as similarity
      FROM meetings.turns t
    `;
    
    const params = [queryEmbedding, limit, minSimilarity];
    
    if (clientId) {
      query += ' JOIN meetings.meetings m ON t.meeting_id = m.id';
      query += ' WHERE t.content_embedding IS NOT NULL AND m.client_id = $4';
      query += ' AND 1 - (t.content_embedding <=> $1::vector) >= $3';
      params.push(clientId);
    } else {
      query += ' WHERE t.content_embedding IS NOT NULL';
      query += ' AND 1 - (t.content_embedding <=> $1::vector) >= $3';
    }
    
    query += ' ORDER BY similarity DESC LIMIT $2';
    
    const result = await this.connector.query(query, params);
    return result.rows;
  }

  /**
   * Get embedding statistics for turns
   * @param {string} meetingId - Optional meeting ID filter
   * @returns {Object} Embedding coverage statistics
   */
  async getEmbeddingStats(meetingId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_turns,
        COUNT(content) as turns_with_content,
        COUNT(content_embedding) as turns_with_embedding,
        COUNT(CASE WHEN content IS NOT NULL AND content_embedding IS NULL THEN 1 END) as turns_needing_embedding
    `;
    
    const params = [];
    
    if (meetingId) {
      query += `, AVG(LENGTH(content)) as avg_content_length,
                MIN(meeting_index) as first_turn_index,
                MAX(meeting_index) as last_turn_index
               FROM meetings.turns WHERE meeting_id = $1`;
      params.push(meetingId);
    } else {
      query += ' FROM meetings.turns';
    }
    
    const result = await this.connector.query(query, params);
    const stats = result.rows[0];
    
    return {
      total_turns: parseInt(stats.total_turns),
      turns_with_content: parseInt(stats.turns_with_content),
      turns_with_embedding: parseInt(stats.turns_with_embedding),
      turns_needing_embedding: parseInt(stats.turns_needing_embedding),
      embedding_coverage: stats.turns_with_content > 0 ? 
        (parseInt(stats.turns_with_embedding) / parseInt(stats.turns_with_content) * 100).toFixed(1) + '%' : '0%',
      avg_content_length: stats.avg_content_length ? parseFloat(stats.avg_content_length).toFixed(1) : null,
      first_turn_index: stats.first_turn_index || null,
      last_turn_index: stats.last_turn_index || null
    };
  }
}