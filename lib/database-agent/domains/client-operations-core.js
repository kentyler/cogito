// Client Operations Core - Orchestrates CRUD operations
// Available methods verified: getAllClients, getClientById, updateClient, deleteClient, getClientName, createClient
import { ClientOperationsCRUD } from './client-operations-crud.js';
import { ClientOperationsCreate } from './client-operations-create.js';

export class ClientOperationsCore {
  constructor(connector) {
    this.connector = connector;
    this._crud = new ClientOperationsCRUD(connector);
    this._create = new ClientOperationsCreate(connector);
  }

  // Delegate to CRUD operations
  async getAllClients() {
    return await this._crud.getAllClients();
  }

  async getClientById(clientId) {
    return await this._crud.getClientById(clientId);
  }

  async updateClient(clientId, updates) {
    return await this._crud.updateClient(clientId, updates);
  }

  async deleteClient(clientId) {
    return await this._crud.deleteClient(clientId);
  }

  async getClientName(clientId) {
    return await this._crud.getClientName(clientId);
  }

  // Delegate to create operations
  async createClient(clientData) {
    return await this._create.createClient(clientData);
  }
}