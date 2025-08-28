/**
 * How-To Search Operations - Finding relevant guides for tasks
 */

export class HowToSearchOperations {
  constructor(db) {
    this.db = db;
  }

  async findHowTo(taskDescription) {
    try {
      // First try exact pattern matching
      const patternResult = await this.db.pool.query(`
        SELECT h.* 
        FROM how_to_guides h
        JOIN task_patterns tp ON h.id = tp.guide_id
        WHERE LOWER(tp.pattern_text) = LOWER($1)
        OR LOWER(tp.normalized_pattern) = LOWER($1)
        LIMIT 1
      `, [taskDescription]);

      if (patternResult.rows.length > 0) {
        return patternResult.rows[0];
      }

      // Fall back to full-text search
      const searchResult = await this.db.pool.query(`
        SELECT * FROM find_how_to($1)
      `, [taskDescription]);

      if (searchResult.rows.length > 0) {
        const guide = await this.db.pool.query(`
          SELECT * FROM how_to_guides WHERE id = $1
        `, [searchResult.rows[0].guide_id]);
        
        if (guide.rows.length > 0) {
          return guide.rows[0];
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding how-to:', error);
      return null;
    }
  }

  async getMostUsedGuides(limit = 10) {
    const query = `
      SELECT 
        g.*,
        COUNT(u.id) as usage_count,
        MAX(u.used_at) as last_used
      FROM how_to_guides g
      LEFT JOIN how_to_usage u ON g.id = u.guide_id
      GROUP BY g.id
      ORDER BY usage_count DESC, last_used DESC
      LIMIT $1
    `;
    
    const result = await this.db.pool.query(query, [limit]);
    return result.rows;
  }

  async getGuidesByCategory(category) {
    const query = `
      SELECT * FROM how_to_guides 
      WHERE category = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await this.db.pool.query(query, [category]);
    return result.rows;
  }
}