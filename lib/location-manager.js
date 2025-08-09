/**
 * Location Manager for Cogito System
 * Manages file paths and their descriptions for quick lookup
 * Now uses DatabaseAgent's LocationOperations domain
 */

import { DatabaseAgent } from './database-agent.js';
import { SemanticLocationSearch } from './semantic-search.js';

export class LocationManager {
  constructor(db) {
    this.db = db; // Keep for backward compatibility
    this.dbAgent = new DatabaseAgent();
    this.semanticSearch = new SemanticLocationSearch(db);
  }

  async initialize() {
    await this.dbAgent.connect();
    await this.createTable();
  }

  async createTable() {
    const result = await this.dbAgent.locations.createTable();
    console.log('✅ Location tracking table ready');
    return result;
  }

  async addLocation(locationData) {
    const result = await this.dbAgent.locations.upsertLocation(locationData);
    
    // Generate embedding for new/updated location
    try {
      const { file_path, description, project, category, tags } = locationData;
      await this.semanticSearch.addEmbedding(file_path, description, project, category, tags);
    } catch (error) {
      console.warn(`Failed to generate embedding for ${locationData.file_path}:`, error.message);
    }
    
    return result;
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
    
    // Fallback to keyword search using DatabaseAgent
    return await this.dbAgent.locations.searchWithAccessUpdate(searchTerm);
  }

  async updateAccessTimes(filePaths) {
    return await this.dbAgent.locations.updateAccessTimes(filePaths);
  }

  async getLocationByPath(filePath) {
    return await this.dbAgent.locations.getByPath(filePath);
  }

  async getRecentLocations(limit = 10) {
    return await this.dbAgent.locations.getRecent(limit);
  }

  async getLocationsByProject(project) {
    return await this.dbAgent.locations.getByProject(project);
  }

  async getLocationsByCategory(category) {
    return await this.dbAgent.locations.getByCategory(category);
  }

  async updateLocationTags(filePath, tags) {
    return await this.dbAgent.locations.updateTags(filePath, tags);
  }

  async deleteLocation(filePath) {
    return await this.dbAgent.locations.delete(filePath);
  }

  async getStats() {
    return await this.dbAgent.locations.getStats();
  }
}