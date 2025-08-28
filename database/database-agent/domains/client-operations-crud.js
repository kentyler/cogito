// Client Operations CRUD - Basic create, read, update, delete operations
// Database fields verified: id, name, created_at, metadata, story, current_llm_id, parent_client_id
export class ClientOperationsCRUD {
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
        current_llm_id,
        parent_client_id
      FROM client_mgmt.clients 
      WHERE id = $1
    `;
    const result = await this.connector.query(query, [clientId]);
    return result.rows[0] || null;
  }

  /**
   * Update a client
   * @param {number} clientId - Client ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated client
   */
  async updateClient(clientId, updates) {
    const { name, story, metadata, current_llm_id, parent_client_id } = updates;
    
    // Build update query dynamically
    let updateFields = [];
    let params = [clientId];
    let paramIndex = 2;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (story !== undefined) {
      updateFields.push(`story = $${paramIndex++}`);
      params.push(story);
    }
    if (metadata !== undefined) {
      updateFields.push(`metadata = $${paramIndex++}`);
      params.push(metadata);
    }
    if (current_llm_id !== undefined) {
      updateFields.push(`current_llm_id = $${paramIndex++}`);
      params.push(current_llm_id);
    }
    if (parent_client_id !== undefined) {
      updateFields.push(`parent_client_id = $${paramIndex++}`);
      params.push(parent_client_id);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No update fields provided');
    }
    
    updateFields.push('updated_at = NOW()');
    
    const query = `
      UPDATE client_mgmt.clients 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING id, name, story, metadata, current_llm_id, parent_client_id, created_at, updated_at
    `;
    
    const result = await this.connector.query(query, params);
    return result.rows[0];
  }

  /**
   * Delete a client
   * @param {number} clientId - Client ID
   * @returns {Object|null} Deleted client or null if not found
   */
  async deleteClient(clientId) {
    const query = `
      DELETE FROM client_mgmt.clients 
      WHERE id = $1
      RETURNING id, name, story, metadata, created_at
    `;
    const result = await this.connector.query(query, [clientId]);
    return result.rows[0] || null;
  }

  /**
   * Get client name by ID
   * @param {number} clientId - Client ID  
   * @returns {string|null} Client name or null if not found
   */
  async getClientName(clientId) {
    const query = `
      SELECT name 
      FROM client_mgmt.clients 
      WHERE id = $1
    `;
    const result = await this.connector.query(query, [clientId]);
    return result.rows[0]?.name || null;
  }
}