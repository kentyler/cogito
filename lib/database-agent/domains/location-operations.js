/**
 * Location Operations - Database operations for file location management
 * Handles location tracking with descriptions, access times, and semantic search
 */

import { LocationOperationsCore } from './location-operations-core.js';
import { LocationOperationsExtended } from './location-operations-extended.js';

export class LocationOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new LocationOperationsCore(connector);
    this._extended = new LocationOperationsExtended(connector);
  }

  // Core operations delegation
  async createTable() {
    return await this._core.createTable();
  }

  async upsertLocation(locationData) {
    return await this._core.upsertLocation(locationData);
  }

  async getByPath(filePath) {
    return await this._core.getByPath(filePath);
  }

  async getRecent(limit = 10) {
    return await this._core.getRecent(limit);
  }

  async delete(filePath) {
    return await this._core.delete(filePath);
  }

  async updateTags(filePath, tags) {
    return await this._core.updateTags(filePath, tags);
  }

  async updateAccessTimes(filePaths) {
    return await this._core.updateAccessTimes(filePaths);
  }

  // Extended operations delegation
  async searchWithAccessUpdate(searchTerm) {
    return await this._extended.searchWithAccessUpdate(searchTerm);
  }

  async getByProject(project) {
    return await this._extended.getByProject(project);
  }

  async getByCategory(category) {
    return await this._extended.getByCategory(category);
  }

  async getStats() {
    return await this._extended.getStats();
  }

  async getAll(filters = {}) {
    return await this._extended.getAll(filters);
  }

  async getProjects() {
    return await this._extended.getProjects();
  }

  async getCategories() {
    return await this._extended.getCategories();
  }
}