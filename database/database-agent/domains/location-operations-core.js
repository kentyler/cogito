/**
 * Location Operations Core - Basic CRUD and Search Operations
 * Handles location tracking with descriptions, access times
 */

export class LocationOperationsCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Create locations table and indexes
   * @returns {Object} Table creation result
   */
  async createTable() {
    // First drop the table if it exists without the proper constraint
    await this.connector.query('DROP TABLE IF EXISTS locations CASCADE');
    
    const query = `
      CREATE TABLE locations (
        id SERIAL PRIMARY KEY,
        file_path TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        project VARCHAR(100),
        category VARCHAR(50),
        tags TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project);
      CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
      CREATE INDEX IF NOT EXISTS idx_locations_description ON locations(description);
    `;
    
    const result = await this.connector.query(query);
    return { success: true, message: 'Locations table and indexes created' };
  }

  /**
   * Add or update location with conflict handling (upsert)
   * @param {Object} locationData - Location data
   * @returns {Object} Created/updated location
   */
  async upsertLocation(locationData) {
    const {
      file_path,
      description,
      project = null,
      category = null,
      tags = null
    } = locationData;

    const query = `
      INSERT INTO locations (file_path, description, project, category, tags)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (file_path) 
      DO UPDATE SET 
        description = EXCLUDED.description,
        project = EXCLUDED.project,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.connector.query(query, [
      file_path, description, project, category, tags
    ]);
    return result.rows[0];
  }

  /**
   * Get location by path and update access time
   * @param {string} filePath - File path
   * @returns {Object|null} Location with updated access time
   */
  async getByPath(filePath) {
    const query = `
      UPDATE locations 
      SET last_accessed = NOW()
      WHERE file_path = $1
      RETURNING *
    `;

    const result = await this.connector.query(query, [filePath]);
    return result.rows[0] || null;
  }

  /**
   * Get recently accessed locations
   * @param {number} limit - Number of locations to return
   * @returns {Array} Recent locations
   */
  async getRecent(limit = 10) {
    const query = `
      SELECT * FROM locations 
      ORDER BY last_accessed DESC
      LIMIT $1
    `;

    const result = await this.connector.query(query, [limit]);
    return result.rows;
  }

  /**
   * Delete location
   * @param {string} filePath - File path
   * @returns {Object} Deleted location
   */
  async delete(filePath) {
    const query = 'DELETE FROM locations WHERE file_path = $1 RETURNING *';
    const result = await this.connector.query(query, [filePath]);
    return result.rows[0];
  }

  /**
   * Update tags for a location
   * @param {string} filePath - File path
   * @param {string} tags - New tags
   * @returns {Object} Updated location
   */
  async updateTags(filePath, tags) {
    const query = `
      UPDATE locations 
      SET tags = $2, updated_at = NOW()
      WHERE file_path = $1
      RETURNING *
    `;

    const result = await this.connector.query(query, [filePath, tags]);
    return result.rows[0];
  }

  /**
   * Update access times for multiple locations
   * @param {Array} filePaths - Array of file paths
   * @returns {Object} Update result
   */
  async updateAccessTimes(filePaths) {
    if (filePaths.length === 0) {
      return { updated: 0 };
    }

    const query = `
      UPDATE locations 
      SET last_accessed = NOW()
      WHERE file_path = ANY($1)
    `;

    const result = await this.connector.query(query, [filePaths]);
    return { updated: result.rowCount };
  }
}