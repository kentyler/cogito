/**
 * File Operations Core - Basic CRUD operations for files and chunks
 * Handles file creation, retrieval, and deletion with transactional support
 */

export class FileOperationsCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get files for a client with optional source type filtering
   * @param {number} clientId - Client ID
   * @param {Array} sourceTypes - Source types to include
   * @returns {Array} Array of files with chunk counts
   */
  async getClientFiles(clientId, sourceTypes = ['upload', 'text-input']) {
    const placeholders = sourceTypes.map((_, i) => `$${i + 2}`).join(', ');
    
    const query = `
      SELECT 
        f.*,
        COUNT(c.id) as chunk_count
      FROM context.files f
      LEFT JOIN context.chunks c ON f.id = c.file_id
      WHERE f.client_id = $1 
        AND f.source_type IN (${placeholders})
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `;
    
    const result = await this.connector.query(query, [clientId, ...sourceTypes]);
    return result.rows;
  }

  /**
   * Get file by ID
   * @param {string} fileId - File UUID
   * @returns {Object|null} File object or null
   */
  async getFileById(fileId) {
    const query = 'SELECT * FROM context.files WHERE id = $1';
    const result = await this.connector.query(query, [fileId]);
    return result.rows[0] || null;
  }

  /**
   * Get file with its content data
   * @param {string} fileId - File UUID
   * @returns {Object|null} File with full content or null
   */
  async getFileWithContent(fileId) {
    const query = `
      SELECT id, filename, file_type, file_size, source_type, 
             client_id, created_at, metadata, content_data
      FROM context.files 
      WHERE id = $1
    `;
    const result = await this.connector.query(query, [fileId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new file record
   * @param {Object} fileData - File data including metadata
   * @returns {Object} Created file record
   */
  async createFile(fileData) {
    const {
      filename,
      file_type,
      file_size,
      source_type,
      client_id,
      metadata = {},
      content_data = ''  // Default to empty string to avoid null constraint
    } = fileData;
    
    const query = `
      INSERT INTO context.files (
        id, filename, file_type, file_size, source_type, 
        client_id, metadata, content_data, created_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
      )
      RETURNING *
    `;
    
    const result = await this.connector.query(query, [
      filename, file_type, file_size, source_type, 
      client_id, metadata, content_data
    ]);
    
    return result.rows[0];
  }

  /**
   * Delete file and its chunks (transactional)
   * @param {string} fileId - File UUID
   * @param {number} clientId - Client ID for security
   * @param {Array} sourceTypes - Allowed source types for deletion
   * @returns {Object} Deletion result with counts
   */
  async deleteFile(fileId, clientId, sourceTypes = ['upload', 'text-input']) {
    return await this.connector.transaction(async (client) => {
      // Delete chunks first (foreign key constraint)
      const chunksResult = await client.query(
        'DELETE FROM context.chunks WHERE file_id = $1 RETURNING id',
        [fileId]
      );
      
      // Delete file with client and source type verification
      const placeholders = sourceTypes.map((_, i) => `$${i + 3}`).join(', ');
      const fileResult = await client.query(`
        DELETE FROM context.files 
        WHERE id = $1 
          AND client_id = $2
          AND source_type IN (${placeholders})
        RETURNING id, filename
      `, [fileId, clientId, ...sourceTypes]);
      
      if (fileResult.rows.length === 0) {
        throw new Error('File not found or access denied');
      }
      
      return {
        file: fileResult.rows[0],
        chunksDeleted: chunksResult.rows.length
      };
    });
  }
}