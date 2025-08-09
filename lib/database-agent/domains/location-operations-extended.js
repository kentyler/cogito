/**
 * Location Operations Extended - Advanced Search and Analytics
 * Handles semantic search, filtering, and statistics
 */

export class LocationOperationsExtended {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Search locations and update access time atomically
   * @param {string} searchTerm - Search term to match
   * @returns {Array} Matching locations with updated access time
   */
  async searchWithAccessUpdate(searchTerm) {
    const wildcardTerm = `%${searchTerm}%`;
    
    const query = `
      WITH matches AS (
        SELECT * FROM locations 
        WHERE 
          file_path ILIKE $1 OR
          description ILIKE $1 OR
          project ILIKE $1 OR
          category ILIKE $1 OR
          tags ILIKE $1
        ORDER BY last_accessed DESC, updated_at DESC
        LIMIT 20
      )
      UPDATE locations 
      SET last_accessed = NOW()
      WHERE id IN (SELECT id FROM matches)
      RETURNING *
    `;

    const result = await this.connector.query(query, [wildcardTerm]);
    return result.rows;
  }

  /**
   * Get locations by project
   * @param {string} project - Project name
   * @returns {Array} Project locations
   */
  async getByProject(project) {
    const query = `
      SELECT * FROM locations 
      WHERE project = $1
      ORDER BY category, file_path
    `;

    const result = await this.connector.query(query, [project]);
    return result.rows;
  }

  /**
   * Get locations by category
   * @param {string} category - Category name
   * @returns {Array} Category locations
   */
  async getByCategory(category) {
    const query = `
      SELECT * FROM locations 
      WHERE category = $1
      ORDER BY project, file_path
    `;

    const result = await this.connector.query(query, [category]);
    return result.rows;
  }

  /**
   * Get location statistics
   * @returns {Object} Location stats
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_locations,
        COUNT(DISTINCT project) as total_projects,
        COUNT(DISTINCT category) as total_categories,
        MAX(updated_at) as last_update
      FROM locations
    `;

    const result = await this.connector.query(query);
    const stats = result.rows[0];

    return {
      total_locations: parseInt(stats.total_locations),
      total_projects: parseInt(stats.total_projects),
      total_categories: parseInt(stats.total_categories),
      last_update: stats.last_update
    };
  }

  /**
   * Get all locations with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Array} Filtered locations
   */
  async getAll(filters = {}) {
    const { project, category, limit = 100, offset = 0 } = filters;
    
    let query = 'SELECT * FROM locations WHERE 1=1';
    const params = [];
    
    if (project) {
      params.push(project);
      query += ` AND project = $${params.length}`;
    }
    
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    query += ' ORDER BY last_accessed DESC';
    
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await this.connector.query(query, params);
    return result.rows;
  }

  /**
   * Get distinct projects
   * @returns {Array} List of projects
   */
  async getProjects() {
    const query = `
      SELECT DISTINCT project 
      FROM locations 
      WHERE project IS NOT NULL 
      ORDER BY project
    `;
    
    const result = await this.connector.query(query);
    return result.rows.map(row => row.project);
  }

  /**
   * Get distinct categories
   * @returns {Array} List of categories
   */
  async getCategories() {
    const query = `
      SELECT DISTINCT category 
      FROM locations 
      WHERE category IS NOT NULL 
      ORDER BY category
    `;
    
    const result = await this.connector.query(query);
    return result.rows.map(row => row.category);
  }
}