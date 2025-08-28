// Client Operations Create - Handles client creation with logging and validation
// Database fields verified: id, name, story, metadata, parent_client_id, created_at
export class ClientOperationsCreate {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Create a new client
   * @param {Object} clientData - Client data
   * @returns {Object} Created client
   */
  async createClient(clientData) {
    const { id, name, story = null, metadata = {}, parent_client_id = null } = clientData;
    
    // Validate name
    if (!name || (typeof name === 'string' && name.trim() === '')) {
      throw new Error('Client name is required and cannot be empty');
    }
    
    try {
      let query;
      let params;
      
      if (id) {
        // If ID is provided, use it
        query = `
          INSERT INTO client_mgmt.clients (id, name, story, metadata, parent_client_id, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id, name, story, metadata, parent_client_id, created_at
        `;
        params = [id, name, story, metadata, parent_client_id];
      } else {
        // Let database generate ID
        query = `
          INSERT INTO client_mgmt.clients (name, story, metadata, parent_client_id, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING id, name, story, metadata, parent_client_id, created_at
        `;
        params = [name, story, metadata, parent_client_id];
      }
      
      const result = await this.connector.query(query, params);
      const client = result.rows[0];
      
      // Log successful client creation
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logEvent('client_created', {
          client_id: client.id,
          client_name: client.name
        }, {
          severity: 'info',
          component: 'Client Operations',
          operation: 'create'
        });
      }
      return client;
    } catch (error) {
      console.error('❌ Error creating client:', error);
      // Log error event
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logError('client_creation_failed', error, {
          severity: 'error',
          component: 'Client Operations',
          operation: 'create'
        });
      }
      throw error;
    }
  }
}