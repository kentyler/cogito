/**
 * Client Operations - Database operations for client management
 * Admin-only functionality for managing client organizations
 */

import { ClientOperationsCore } from './client-operations-core.js';
import { ClientOperationsStats } from './client-operations-stats.js';

export class ClientOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new ClientOperationsCore(connector);
    this._stats = new ClientOperationsStats(connector);
  }

  // Core operations delegation
  async getAllClients() {
    return await this._core.getAllClients();
  }

  async getClientById(clientId) {
    return await this._core.getClientById(clientId);
  }

  async createClient(clientData) {
    return await this._core.createClient(clientData);
  }

  async updateClient(clientId, updates) {
    return await this._core.updateClient(clientId, updates);
  }

  async deleteClient(clientId) {
    return await this._core.deleteClient(clientId);
  }

  // Statistics operations delegation
  async getClientStats(clientId) {
    return await this._stats.getClientStats(clientId);
  }

  async getAllClientsWithStats() {
    return await this._stats.getAllClientsWithStats();
  }
}