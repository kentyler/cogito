/**
 * Location Manager for Cogito System
 * Manages file paths and their descriptions for quick lookup
 */

import { SemanticLocationSearch } from './semantic-search.js';

export class LocationManager {
  constructor(db) {
    this.db = db;
    this.semanticSearch = new SemanticLocationSearch(db);
  }

  async initialize() {
    await this.createTable();
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS locations (
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
    
    await this.db.query(query);
    console.log('✅ Location tracking table ready');
  }

  async addLocation(locationData) {
    const { file_path, description, project, category, tags } = locationData;
    
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
    
    const result = await this.db.query(query, [
      file_path,
      description,
      project || null,
      category || null,
      tags || null
    ]);
    
    // Generate embedding for new/updated location
    try {
      await this.semanticSearch.addEmbedding(file_path, description, project, category, tags);
    } catch (error) {
      console.warn(`Failed to generate embedding for ${file_path}:`, error.message);
    }
    
    return result.rows[0];
  }

  async findLocations(searchTerm) {
    // Try semantic search first
    try {
      const semanticResults = await this.semanticSearch.search(searchTerm, 10);
      if (semanticResults.length > 0) {
        // Update access times for semantic results
        const filePaths = semanticResults.map(r => r.file_path);
        await this.updateAccessTimes(filePaths);
        return semanticResults;
      }
    } catch (error) {
      console.warn('Semantic search failed, falling back to keyword search:', error.message);
    }
    
    // Fallback to keyword search
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
    
    const result = await this.db.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }

  async updateAccessTimes(filePaths) {
    if (filePaths.length === 0) return;
    
    const query = `
      UPDATE locations 
      SET last_accessed = NOW()
      WHERE file_path = ANY($1)
    `;
    
    await this.db.query(query, [filePaths]);
  }

  async getLocationByPath(filePath) {
    const query = `
      UPDATE locations 
      SET last_accessed = NOW()
      WHERE file_path = $1
      RETURNING *
    `;
    
    const result = await this.db.query(query, [filePath]);
    return result.rows[0] || null;
  }

  async getRecentLocations(limit = 10) {
    const query = `
      SELECT * FROM locations 
      ORDER BY last_accessed DESC
      LIMIT $1
    `;
    
    const result = await this.db.query(query, [limit]);
    return result.rows;
  }

  async getLocationsByProject(project) {
    const query = `
      SELECT * FROM locations 
      WHERE project = $1
      ORDER BY category, file_path
    `;
    
    const result = await this.db.query(query, [project]);
    return result.rows;
  }

  async getLocationsByCategory(category) {
    const query = `
      SELECT * FROM locations 
      WHERE category = $1
      ORDER BY project, file_path
    `;
    
    const result = await this.db.query(query, [category]);
    return result.rows;
  }

  async updateLocationTags(filePath, tags) {
    const query = `
      UPDATE locations 
      SET tags = $2, updated_at = NOW()
      WHERE file_path = $1
      RETURNING *
    `;
    
    const result = await this.db.query(query, [filePath, tags]);
    return result.rows[0];
  }

  async deleteLocation(filePath) {
    const query = 'DELETE FROM locations WHERE file_path = $1 RETURNING *';
    const result = await this.db.query(query, [filePath]);
    return result.rows[0];
  }

  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_locations,
        COUNT(DISTINCT project) as total_projects,
        COUNT(DISTINCT category) as total_categories,
        MAX(updated_at) as last_update
      FROM locations
    `;
    
    const result = await this.db.query(query);
    return result.rows[0];
  }
}