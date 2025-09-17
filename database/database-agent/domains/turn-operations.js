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

  // Directed turn operations
  async getTurnsDirectedToUser(userId, meetingId = null, limit = 100) {
    const query = `
      SELECT id, meeting_id, user_id, content, directed_to, timestamp, metadata
      FROM meetings.turns
      WHERE directed_to @> $1::jsonb
      AND ($2::uuid IS NULL OR meeting_id = $2)
      ORDER BY timestamp DESC
      LIMIT $3
    `;
    const result = await this.connector.query(query, [JSON.stringify([userId]), meetingId, limit]);
    return result.rows;
  }

  async updateTurnDirection(turnId, userId, action) {
    const query = `SELECT meetings.update_turn_direction($1, $2, $3)`;
    const result = await this.connector.query(query, [turnId, userId, action]);
    return result.rows[0];
  }

  // @ parsing and addressing logic
  parseAddressing(content) {
    // First, remove email addresses to avoid false matches
    const contentWithoutEmails = content.replace(/\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '');
    
    // Check for solitary @ (Cogito addressing) 
    const hasCogitoAddress = /(?:^|\s)@(?!\w)/.test(contentWithoutEmails);
    
    // Find @username mentions (user addressing)
    const userMentionPattern = /(?:^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[^\w@.])/g;
    const userMentions = [...contentWithoutEmails.matchAll(userMentionPattern)]
      .map(match => match[1])
      .filter(username => username.length > 0);
    
    return {
      shouldInvokeCogito: hasCogitoAddress,
      userMentions: userMentions,
      isComment: !hasCogitoAddress && userMentions.length === 0
    };
  }

  async createTurnWithAddressing(turnData) {
    const addressing = this.parseAddressing(turnData.content);
    
    // Add addressing metadata
    const turnWithAddressing = {
      ...turnData,
      metadata: {
        ...turnData.metadata,
        addressing: {
          shouldInvokeCogito: addressing.shouldInvokeCogito,
          userMentions: addressing.userMentions,
          isComment: addressing.isComment
        }
      }
    };

    // For now, we'll leave directed_to empty and handle user mentions in future iterations
    // Focus on Cogito addressing first
    turnWithAddressing.directed_to = [];

    return await this.createTurn(turnWithAddressing);
  }
}