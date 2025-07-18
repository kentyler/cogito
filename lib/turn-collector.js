/**
 * Turn Collector - Assembles sets of turns for analysis
 * Separates the concern of "what turns to analyze" from "how to analyze them"
 */

export class TurnCollector {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Collect turns from a single block
   * @param {string} blockId - Block ID to collect turns from
   * @param {Object} options - Collection options
   * @returns {Array} - Array of turn objects with embeddings
   */
  async collectFromBlock(blockId, options = {}) {
    const { 
      includeEmbeddings = true,
      minContentLength = 10,
      sourceTypes = null, // null = all types
      timeRange = null    // { start, end }
    } = options;

    let query = `
      SELECT 
        t.turn_id,
        t.content,
        t.timestamp,
        t.source_type,
        t.metadata,
        ${includeEmbeddings ? 't.content_embedding' : 'NULL as content_embedding'}
      FROM conversation.turns t
      JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      WHERE bt.block_id = $1
      AND t.content IS NOT NULL
      AND LENGTH(t.content) >= $2
    `;

    const params = [blockId, minContentLength];
    let paramIndex = 3;

    // Add source type filter
    if (sourceTypes && sourceTypes.length > 0) {
      query += ` AND t.source_type = ANY($${paramIndex})`;
      params.push(sourceTypes);
      paramIndex++;
    }

    // Add time range filter
    if (timeRange) {
      query += ` AND t.timestamp >= $${paramIndex} AND t.timestamp <= $${paramIndex + 1}`;
      params.push(timeRange.start, timeRange.end);
      paramIndex += 2;
    }

    if (includeEmbeddings) {
      query += ` AND t.content_embedding IS NOT NULL`;
    }

    query += ` ORDER BY t.timestamp`;

    const result = await this.pool.query(query, params);
    return this.processRows(result.rows);
  }

  /**
   * Collect turns from multiple blocks
   * @param {Array} blockIds - Array of block IDs
   * @param {Object} options - Collection options
   * @returns {Array} - Array of turn objects with embeddings
   */
  async collectFromBlocks(blockIds, options = {}) {
    if (!blockIds || blockIds.length === 0) return [];

    const { 
      includeEmbeddings = true,
      minContentLength = 10,
      sourceTypes = null,
      timeRange = null,
      maxTurnsPerBlock = null
    } = options;

    // If maxTurnsPerBlock is specified, collect from each block separately
    if (maxTurnsPerBlock) {
      const allTurns = [];
      for (const blockId of blockIds) {
        const blockTurns = await this.collectFromBlock(blockId, {
          ...options,
          maxTurnsPerBlock: undefined // Remove this option for individual calls
        });
        
        // Limit turns per block
        const limitedTurns = blockTurns.slice(0, maxTurnsPerBlock);
        allTurns.push(...limitedTurns);
      }
      return allTurns.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // Otherwise, collect all at once
    let query = `
      SELECT 
        t.turn_id,
        t.content,
        t.timestamp,
        t.source_type,
        t.metadata,
        bt.block_id,
        ${includeEmbeddings ? 't.content_embedding' : 'NULL as content_embedding'}
      FROM conversation.turns t
      JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      WHERE bt.block_id = ANY($1)
      AND t.content IS NOT NULL
      AND LENGTH(t.content) >= $2
    `;

    const params = [blockIds, minContentLength];
    let paramIndex = 3;

    // Add filters (same as single block)
    if (sourceTypes && sourceTypes.length > 0) {
      query += ` AND t.source_type = ANY($${paramIndex})`;
      params.push(sourceTypes);
      paramIndex++;
    }

    if (timeRange) {
      query += ` AND t.timestamp >= $${paramIndex} AND t.timestamp <= $${paramIndex + 1}`;
      params.push(timeRange.start, timeRange.end);
      paramIndex += 2;
    }

    if (includeEmbeddings) {
      query += ` AND t.content_embedding IS NOT NULL`;
    }

    query += ` ORDER BY t.timestamp`;

    const result = await this.pool.query(query, params);
    return this.processRows(result.rows);
  }

  /**
   * Collect turns by semantic similarity to a query
   * @param {string} queryText - Text to find similar turns for
   * @param {Object} options - Collection options
   * @returns {Array} - Array of similar turn objects
   */
  async collectBySimilarity(queryText, options = {}) {
    const {
      limit = 50,
      minSimilarity = 0.7,
      blockIds = null,
      sourceTypes = null,
      timeRange = null
    } = options;

    // This would require the embedding service to generate query embedding
    // For now, placeholder - would need to integrate with EmbeddingService
    throw new Error('Similarity-based collection not yet implemented');
  }

  /**
   * Collect recent turns within a time window
   * @param {number} windowMinutes - Time window in minutes
   * @param {Object} options - Collection options
   * @returns {Array} - Array of recent turn objects
   */
  async collectRecent(windowMinutes, options = {}) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (windowMinutes * 60 * 1000));
    
    return await this.collectFromBlocks(
      options.blockIds || await this.getAllBlockIds(),
      {
        ...options,
        timeRange: { start: startTime, end: endTime }
      }
    );
  }

  /**
   * Collect turns from a conversation thread (following source_turn_id links)
   * @param {string} rootTurnId - Starting turn ID
   * @param {Object} options - Collection options
   * @returns {Array} - Array of turn objects in thread
   */
  async collectThread(rootTurnId, options = {}) {
    const { includeEmbeddings = true, maxDepth = 10 } = options;

    const allTurns = [];
    const visited = new Set();
    const queue = [{ turnId: rootTurnId, depth: 0 }];

    while (queue.length > 0) {
      const { turnId, depth } = queue.shift();
      
      if (visited.has(turnId) || depth > maxDepth) continue;
      visited.add(turnId);

      // Get the turn
      const turnQuery = `
        SELECT 
          turn_id,
          content,
          timestamp,
          source_type,
          metadata,
          source_turn_id,
          ${includeEmbeddings ? 'content_embedding' : 'NULL as content_embedding'}
        FROM conversation.turns
        WHERE turn_id = $1
      `;

      const turnResult = await this.pool.query(turnQuery, [turnId]);
      if (turnResult.rows.length > 0) {
        allTurns.push(...this.processRows(turnResult.rows));
      }

      // Find responses to this turn
      const responseQuery = `
        SELECT turn_id
        FROM conversation.turns
        WHERE source_turn_id = $1
      `;

      const responseResult = await this.pool.query(responseQuery, [turnId]);
      for (const row of responseResult.rows) {
        queue.push({ turnId: row.turn_id, depth: depth + 1 });
      }
    }

    return allTurns.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get all block IDs (helper method)
   * @returns {Array} - Array of block IDs
   */
  async getAllBlockIds() {
    const result = await this.pool.query('SELECT block_id FROM conversation.blocks');
    return result.rows.map(row => row.block_id);
  }

  /**
   * Process database rows into turn objects
   * @param {Array} rows - Database rows
   * @returns {Array} - Processed turn objects
   */
  processRows(rows) {
    return rows.map(row => ({
      turn_id: row.turn_id,
      content: row.content,
      timestamp: row.timestamp,
      source_type: row.source_type,
      metadata: row.metadata,
      block_id: row.block_id,
      content_embedding: row.content_embedding ? this.parseEmbedding(row.content_embedding) : null
    }));
  }

  /**
   * Parse pgvector embedding into array
   * @param {string} vectorString - pgvector string representation
   * @returns {Array} - Embedding array
   */
  parseEmbedding(vectorString) {
    if (!vectorString) return null;
    
    try {
      // pgvector returns as "[1,2,3]" string, need to parse
      if (typeof vectorString === 'string') {
        return JSON.parse(vectorString);
      }
      return vectorString;
    } catch (error) {
      console.error('Error parsing embedding:', error);
      return null;
    }
  }

  /**
   * Get collection statistics
   * @param {string} blockId - Block ID to get stats for
   * @returns {Object} - Statistics object
   */
  async getCollectionStats(blockId) {
    const query = `
      SELECT 
        COUNT(*) as total_turns,
        COUNT(t.content_embedding) as turns_with_embeddings,
        COUNT(DISTINCT t.source_type) as unique_source_types,
        MIN(t.timestamp) as earliest_turn,
        MAX(t.timestamp) as latest_turn,
        AVG(LENGTH(t.content)) as avg_content_length
      FROM conversation.turns t
      JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      WHERE bt.block_id = $1
      AND t.content IS NOT NULL
    `;

    const result = await this.pool.query(query, [blockId]);
    return result.rows[0];
  }
}