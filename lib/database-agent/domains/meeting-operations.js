/**
 * Meeting Operations - Database operations for meeting management
 * Handles CRUD operations, status updates, and meeting lifecycle
 */

import { MeetingOperationsCore } from './meeting-operations-core.js';
import { MeetingOperationsExtended } from './meeting-operations-extended.js';

export class MeetingOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new MeetingOperationsCore(connector);
    this._extended = new MeetingOperationsExtended(connector);
    this.turnsOperations = null;
  }

  setTurnsOperations(turnsOperations) {
    this.turnsOperations = turnsOperations;
    this._core.setTurnsOperations(turnsOperations);
  }

  // Core operations delegation
  async getByBotId(botId, excludeStatuses = ['completed', 'inactive']) {
    return await this._core.getByBotId(botId, excludeStatuses);
  }

  async getById(meetingId) {
    return await this._core.getById(meetingId);
  }

  async updateStatus(botId, status) {
    return await this._core.updateStatus(botId, status);
  }

  async create(meetingData) {
    return await this._core.create(meetingData);
  }

  async deleteMeeting(meetingId) {
    return await this._core.delete(meetingId);
  }

  async delete(meetingId) {
    return await this._core.delete(meetingId);
  }

  async getMeetingByNameAndType(name, meetingType) {
    return await this._core.getMeetingByNameAndType(name, meetingType);
  }

  async createMeeting(meetingData) {
    return await this._core.create(meetingData);
  }

  async getMeetingClientInfo(meetingId) {
    return await this._core.getMeetingClientInfo(meetingId);
  }

  async getMeetingClientId(meetingId) {
    return await this._core.getMeetingClientId(meetingId);
  }

  // Extended operations delegation
  async listWithStats(clientId, options = {}) {
    return await this._extended.listWithStats(clientId, options);
  }

  async getActiveCount() {
    return await this._extended.getActiveCount();
  }

  async getActiveMeetings() {
    return await this._extended.getActiveMeetings();
  }

  async getByBotIds(botIds) {
    return await this._extended.getByBotIds(botIds);
  }

  async getTranscript(meetingId) {
    return await this._extended.getTranscript(meetingId);
  }

  async markEmailSent(meetingId) {
    return await this._extended.markEmailSent(meetingId);
  }

  async getMeetingWithCreator(meetingId) {
    return await this._extended.getMeetingWithCreator(meetingId);
  }
}