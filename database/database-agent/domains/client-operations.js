/**
 * Client Operations - Database operations for client management
 * Admin-only functionality for managing client organizations
 */

import { ClientOperationsCore } from './client-operations-core.js';
import { ClientOperationsStats } from './client-operations-stats.js';
import { ClientOperationsUserMgmt } from './client-operations-user-mgmt.js';

export class ClientOperations {
  constructor(connector) {
    this.connector = connector;
    this._core = new ClientOperationsCore(connector);
    this._stats = new ClientOperationsStats(connector);
    this._userMgmt = new ClientOperationsUserMgmt(connector);
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

  async getClientName(clientId) {
    return await this._core.getClientName(clientId);
  }

  // Statistics operations delegation
  async getClientStats(clientId) {
    return await this._stats.getClientStats(clientId);
  }

  async getAllClientsWithStats() {
    return await this._stats.getAllClientsWithStats();
  }

  // User management operations delegation
  async getClientUsers(clientId) {
    return await this._userMgmt.getClientUsers(clientId);
  }

  async addUserToClient(userId, clientId, role) {
    return await this._userMgmt.addUserToClient(userId, clientId, role);
  }

  async removeUserFromClient(userId, clientId) {
    return await this._userMgmt.removeUserFromClient(userId, clientId);
  }

  async checkUserClientAccess(userId, clientId) {
    return await this._userMgmt.checkUserClientAccess(userId, clientId);
  }

  async checkUserClientAssociation(userId, clientId) {
    return await this._userMgmt.checkUserClientAssociation(userId, clientId);
  }
}