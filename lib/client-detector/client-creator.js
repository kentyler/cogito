/**
 * Client Creator - Handle new client creation
 */

export class ClientCreator {
  constructor(databaseManager) {
    this.db = databaseManager;
  }

  /**
   * Create a new client based on user confirmation
   * @param {string} name - Client name
   * @param {string} description - Optional description
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - Creation result
   */
  async createNewClient(name, description = '', metadata = {}) {
    try {
      const query = `
        INSERT INTO clients (name, metadata, created_at)
        VALUES ($1, $2, NOW())
        RETURNING id, name
      `;
      
      const result = await this.db.query(query, [
        name,
        { ...metadata, created_by: 'client_detector', description }
      ]);

      return {
        status: 'created',
        client: result.rows[0],
        message: `Created new client: "${result.rows[0].name}"`
      };

    } catch (error) {
      console.error('Error creating new client:', error);
      return {
        status: 'error',
        message: 'Failed to create new client',
        error: error.message
      };
    }
  }
}