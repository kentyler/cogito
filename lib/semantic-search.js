/**
 * Semantic Search for Locations using Python embedding service
 */

import { spawn } from 'child_process';
import path from 'path';

export class SemanticLocationSearch {
  constructor(db) {
    this.db = db;
    this.pythonScript = path.join(process.cwd(), 'scripts', 'semantic-location-search.py');
  }

  /**
   * Search locations using semantic similarity
   * @param {string} query - Natural language search query
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} - Array of location results with similarity scores
   */
  async search(query, limit = 5) {
    try {
      // First try semantic search
      const semanticResults = await this.semanticSearch(query, limit);
      
      if (semanticResults.length > 0) {
        return semanticResults;
      }
      
      // Fallback to keyword search if no semantic results
      console.log('No semantic results, falling back to keyword search');
      return await this.keywordSearch(query, limit);
      
    } catch (error) {
      console.error('Semantic search error:', error);
      // Fallback to keyword search on error
      return await this.keywordSearch(query, limit);
    }
  }

  /**
   * Perform semantic search using embeddings
   */
  async semanticSearch(query, limit) {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [
        this.pythonScript,
        '--query', query,
        '--limit', limit.toString()
      ], {
        cwd: process.cwd()
      });

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${error}`));
          return;
        }

        try {
          const results = JSON.parse(output);
          resolve(results);
        } catch (e) {
          reject(new Error(`Failed to parse results: ${e.message}`));
        }
      });
    });
  }

  /**
   * Fallback keyword search
   */
  async keywordSearch(searchTerm, limit) {
    const query = `
      SELECT file_path, description, project, category, tags,
             last_accessed, metadata
      FROM locations
      WHERE 
        LOWER(file_path) LIKE LOWER($1) OR
        LOWER(description) LIKE LOWER($1) OR
        LOWER(project) LIKE LOWER($1) OR
        LOWER(category) LIKE LOWER($1) OR
        LOWER(tags) LIKE LOWER($1)
      ORDER BY last_accessed DESC
      LIMIT $2
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const result = await this.db.query(query, [searchPattern, limit]);
    
    return result.rows.map(row => ({
      ...row,
      similarity: 0.5 // Default similarity for keyword matches
    }));
  }

  /**
   * Add embedding for a new location
   */
  async addEmbedding(file_path, description, project, category, tags) {
    return new Promise((resolve, reject) => {
      const searchText = this.buildSearchText(description, project, category, tags, file_path);
      
      const python = spawn('python3', [
        this.pythonScript,
        '--embed',
        '--text', searchText,
        '--file_path', file_path
      ], {
        cwd: process.cwd()
      });

      let error = '';

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to generate embedding: ${error}`));
          return;
        }
        resolve();
      });
    });
  }

  buildSearchText(description, project, category, tags, file_path) {
    let searchText = description;
    if (project) searchText += ` project:${project}`;
    if (category) searchText += ` category:${category}`;
    if (tags) searchText += ` tags:${tags}`;
    
    const filename = path.basename(file_path);
    searchText += ` filename:${filename}`;
    
    return searchText;
  }
}