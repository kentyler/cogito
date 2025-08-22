/**
 * Client Settings Operations - Manage client-specific configuration settings
 * Unified interface combining core and extended operations
 */

import { ClientSettingsOperationsCore } from './client-settings-operations-core.js';
import { ClientSettingsOperationsExtended } from './client-settings-operations-extended.js';

export class ClientSettingsOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new ClientSettingsOperationsCore(connector);
    this._extended = new ClientSettingsOperationsExtended(connector);
  }

  // Core operations delegation
  async getClientSetting(clientId, settingKey) {
    return await this._core.getClientSetting(clientId, settingKey);
  }

  async getClientSettings(clientId) {
    return await this._core.getClientSettings(clientId);
  }

  async setClientSetting(clientId, settingKey, settingValue, settingType = 'string', userId = null) {
    return await this._core.setClientSetting(clientId, settingKey, settingValue, settingType, userId);
  }

  async deleteClientSetting(clientId, settingKey) {
    return await this._core.deleteClientSetting(clientId, settingKey);
  }

  // Extended operations delegation
  async setClientSettings(clientId, settings, userId = null) {
    return await this._extended.setClientSettings(clientId, settings, userId);
  }

  async getClientSettingsMap(clientId) {
    return await this._extended.getClientSettingsMap(clientId, this._core);
  }

  async getClientTemperature(clientId, fallback = 0.7) {
    return await this._extended.getClientTemperature(clientId, fallback, this._core);
  }

  async setClientTemperature(clientId, temperature, userId = null) {
    return await this._extended.setClientTemperature(clientId, temperature, userId, this._core);
  }

  async initializeDefaultSettings(clientId, userId = null) {
    return await this._extended.initializeDefaultSettings(clientId, userId);
  }
}