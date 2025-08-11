/**
 * Client Operations Core - Basic CRUD operations for client management
 */

export class ClientOperationsCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get all clients with basic information
   * @returns {Array} Array of client records
   */
  async getAllClients() {
    const query = `
      SELECT 
        id, 
        name, 
        created_at, 
        metadata,
        story
      FROM client_mgmt.clients 
      ORDER BY name ASC
    `;
    const result = await this.connector.query(query);
    return result.rows;
  }

  /**
   * Get client by ID
   * @param {number} clientId - Client ID
   * @returns {Object|null} Client data or null if not found
   */
  async getClientById(clientId) {
    const query = `
      SELECT 
        id, 
        name, 
        created_at, 
        metadata,
        story,
        current_llm_id
      FROM client_mgmt.clients 
      WHERE id = $1
    `;
    const result = await this.connector.query(query, [clientId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new client
   * @param {Object} clientData - Client data
   * @returns {Object} Created client
   */
  async createClient(clientData) {
    const { name, story = null, metadata = {} } = clientData;
    
    // Validate name
    if (!name || (typeof name === 'string' && name.trim() === '')) {
      throw new Error('Client name is required and cannot be empty');
    }
    
    try {
      const query = `
        INSERT INTO client_mgmt.clients (name, story, metadata, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, name, story, metadata, created_at
      `;
      
      const result = await this.connector.query(query, [name, story, metadata]);
      const client = result.rows[0];
      
      // Log successful client creation
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logEvent('client_created', {
          client_id: client.id,
          client_name: client.name
        }, {
          severity: 'info',
          component: 'ClientOperations'
        });
      }
      
      return client;
    } catch (error) {
      // Log client creation errors
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logError('client_creation_failed', error, {
          client_name: name,
          component: 'ClientOperations',
          severity: 'error'
        });
      }
      throw error;
    }
  }

  /**
   * Update client information
   * @param {number} clientId - Client ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated client or null if not found
   */
  async updateClient(clientId, updates) {
    const allowedFields = ['name', 'story', 'metadata', 'current_llm_id'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.keys(updates).forEach(field => {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(clientId); // Add clientId as last parameter

    const query = `
      UPDATE client_mgmt.clients 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, story, metadata, created_at, current_llm_id
    `;

    const result = await this.connector.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a client and all associated data
   * @param {number} clientId - Client ID
   * @returns {Object|null} Deleted client or null if not found
   */
  async deleteClient(clientId) {
    try {
      // First check if client exists and get info
      const client = await this.getClientById(clientId);
      if (!client) {
        return null;
      }

      // Delete client (will cascade to user_clients, meetings, files, etc.)
      const query = `
        DELETE FROM client_mgmt.clients 
        WHERE id = $1
        RETURNING id, name
      `;
      
      const result = await this.connector.query(query, [clientId]);
      const deletedClient = result.rows[0];
      
      if (deletedClient) {
        // Log successful client deletion
        const eventLogger = this.connector.getEventLogger();
        if (eventLogger) {
          await eventLogger.logEvent('client_deleted', {
            client_id: deletedClient.id,
            client_name: deletedClient.name
          }, {
            severity: 'warning',
            component: 'ClientOperations'
          });
        }
      }
      
      return deletedClient;
    } catch (error) {
      // Log client deletion errors
      const eventLogger = this.connector.getEventLogger();
      if (eventLogger) {
        await eventLogger.logError('client_deletion_failed', error, {
          client_id: clientId,
          component: 'ClientOperations',
          severity: 'error'
        });
      }
      throw error;
    }
  }

}