/**
 * Bot Operations - Database operations for bot lifecycle management
 * Handles active bots listing, stuck meeting management, and bot status transitions
 */

import { BotOperationsCore } from './bot-operations-core.js';
import { BotOperationsExtended } from './bot-operations-extended.js';

export class BotOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new BotOperationsCore(connector);
    this._extended = new BotOperationsExtended(connector);
  }

  // Core operations delegation
  async getActiveBots() {
    return await this._core.getActiveBots();
  }

  async getStuckMeetings() {
    return await this._core.getStuckMeetings();
  }

  async forceCompleteMeeting(botId) {
    return await this._core.forceCompleteMeeting(botId);
  }

  async setBotStatusLeaving(botId) {
    return await this._core.setBotStatusLeaving(botId);
  }

  async setBotStatusInactive(botId) {
    return await this._core.setBotStatusInactive(botId);
  }

  async updateMeetingStatus(botId, status) {
    return await this._core.updateMeetingStatus(botId, status);
  }

  // Extended operations delegation
  async getBotMeeting(botId) {
    return await this._extended.getBotMeeting(botId);
  }

  async getBotStats() {
    return await this._extended.getBotStats();
  }

  async getBotsByStatus(status, limit = 100) {
    return await this._extended.getBotsByStatus(status, limit);
  }
}