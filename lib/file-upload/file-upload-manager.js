/**
 * File Upload Manager - Create and manage file upload records
 */

import pg from 'pg';
const { Pool } = pg;

export class FileUploadManager {
  constructor() {
    // Use same Supabase connection as Cogito
    this.pool = new Pool({
      connectionString: 'postgresql://user:password@host/database',
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Create a new file upload record
   * @param {Object} uploadData - The upload data
   * @param {number} clientId - Client ID (default: 6 for Cogito)
   * @returns {Object} - Created file upload record
   */
  async createFileUpload(uploadData, clientId = 6) {
    const {
      filename,
      mimeType,
      filePath,
      fileSize,
      publicUrl,
      bucketName,
      description,
      tags
    } = uploadData;

    try {
      const result = await this.pool.query(`
        INSERT INTO context.files 
        (filename, content_type, content_data, file_size, source_type, metadata) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `, [
        filename,
        mimeType,
        fileContent, // This should be the actual file content as bytea
        fileSize || 0,
        'upload',
        JSON.stringify({
          description: description || null,
          tags: tags || null,
          client_id: clientId,
          original_path: filePath,
          public_url: publicUrl,
          bucket_name: bucketName
        })
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating file upload:', error);
      throw new Error(`Failed to create file upload: ${error.message}`);
    }
  }

  /**
   * Get file upload by ID
   * @param {number} fileId - File ID
   * @param {number} clientId - Client ID
   * @returns {Object|null} - File upload record or null
   */
  async getFileUploadById(fileId, clientId = 6) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM context.files WHERE id = $1 AND metadata->>\'client_id\' = $2',
        [fileId, clientId.toString()]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting file upload:', error);
      throw error;
    }
  }

  /**
   * List file uploads for a client
   * @param {number} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of file upload records
   */
  async listFileUploads(clientId = 6, options = {}) {
    const { limit = 50, offset = 0, tags } = options;
    
    try {
      let query = 'SELECT * FROM file_uploads WHERE client_id = $1';
      const params = [clientId];
      
      if (tags && tags.length > 0) {
        query += ' AND tags && $2';
        params.push(tags);
      }
      
      query += ' ORDER BY uploaded_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error listing file uploads:', error);
      throw error;
    }
  }

  /**
   * Delete a file upload and its vectors
   * @param {number} fileId - File ID
   * @param {number} clientId - Client ID
   * @returns {Object} - Deleted file upload record
   */
  async deleteFileUpload(fileId, clientId = 6) {
    try {
      const result = await this.pool.query(
        'DELETE FROM file_uploads WHERE id = $1 AND client_id = $2 RETURNING *',
        [fileId, clientId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('File not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting file upload:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}