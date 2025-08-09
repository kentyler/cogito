/**
 * Turn Operations - Database operations for conversation turn management
 * Handles turn CRUD, embedding operations, and semantic similarity search
 */

import { TurnOperationsCore } from './turn-operations-core.js';
import { TurnOperationsExtended } from './turn-operations-extended.js';

export class TurnOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new TurnOperationsCore(connector);
    this._extended = new TurnOperationsExtended(connector);
  }

  // Core operations delegation
  async createTurn(turnData) {
    return await this._core.createTurn(turnData);
  }

  async getById(turnId) {
    return await this._core.getById(turnId);
  }

  async getByMeetingId(meetingId, options = {}) {
    return await this._core.getByMeetingId(meetingId, options);
  }

  async delete(turnId) {
    return await this._core.delete(turnId);
  }

  async deleteByMeetingId(meetingId) {
    return await this._core.deleteByMeetingId(meetingId);
  }

  async updateEmbedding(turnId, embedding) {
    return await this._core.updateEmbedding(turnId, embedding);
  }

  // Extended operations delegation
  async findSimilarTurns(turnId, limit = 10, minSimilarity = 0.7) {
    return await this._extended.findSimilarTurns(turnId, limit, minSimilarity);
  }

  async searchBySimilarity(queryEmbedding, limit = 20, minSimilarity = 0.5, clientId = null) {
    return await this._extended.searchBySimilarity(queryEmbedding, limit, minSimilarity, clientId);
  }

  async getEmbeddingStats(meetingId = null) {
    return await this._extended.getEmbeddingStats(meetingId);
  }
}