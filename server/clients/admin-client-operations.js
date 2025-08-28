import { extractRequestContext } from '#server/events/event-logger.js';

/**
 * Admin client operations - handles CRUD operations for client management
 * Restricted to admin users (ken@8thfold.com, user_id = 1)
 */
export class AdminClientOperations {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Get all clients with statistics
   */
  async getAllClients() {
    return await this.dbAgent.clients.getAllClientsWithStats();
  }

  /**
   * Get specific client details with stats
   */
  async getClientDetails(clientId) {
    const client = await this.dbAgent.clients.getClientById(clientId);
    if (!client) {
      return null;
    }

    const stats = await this.dbAgent.clients.getClientStats(clientId);
    return { ...client, ...stats };
  }

  /**
   * Create a new client
   */
  async createClient(data, req) {
    const { name, story, metadata } = data;
    
    if (!name || name.trim() === '') {
      throw new Error('Client name is required');
    }

    const clientData = {
      name: name.trim(),
      story: story?.trim() || null,
      metadata: metadata || {}
    };

    const client = await this.dbAgent.clients.createClient(clientData);
    
    // Log successful creation
    const context = extractRequestContext(req);
    const eventLogger = this.dbAgent.getEventLogger();
    if (eventLogger) {
      await eventLogger.logEvent('admin_client_created', {
        client_id: client.id,
        client_name: client.name,
        admin_user_id: req.session.user.id
      }, {
        ...context,
        severity: 'info',
        component: 'ClientManagement'
      });
    }

    return client;
  }

  /**
   * Update an existing client
   */
  async updateClient(clientId, updates) {
    const cleanedUpdates = {};

    if (updates.name !== undefined) cleanedUpdates.name = updates.name.trim();
    if (updates.story !== undefined) cleanedUpdates.story = updates.story?.trim() || null;
    if (updates.metadata !== undefined) cleanedUpdates.metadata = updates.metadata;

    if (Object.keys(cleanedUpdates).length === 0) {
      throw new Error('No updates provided');
    }

    return await this.dbAgent.clients.updateClient(clientId, cleanedUpdates);
  }

  /**
   * Delete a client and all associated data
   */
  async deleteClient(clientId, req) {
    // Get client info before deletion for logging
    const clientInfo = await this.dbAgent.clients.getClientById(clientId);
    if (!clientInfo) {
      return null;
    }

    const deletedClient = await this.dbAgent.clients.deleteClient(clientId);
    
    // Log successful deletion
    const context = extractRequestContext(req);
    const eventLogger = this.dbAgent.getEventLogger();
    if (eventLogger) {
      await eventLogger.logEvent('admin_client_deleted', {
        client_id: clientId,
        client_name: clientInfo.name,
        admin_user_id: req.session.user.id
      }, {
        ...context,
        severity: 'warning',
        component: 'ClientManagement'
      });
    }

    return deletedClient;
  }
}