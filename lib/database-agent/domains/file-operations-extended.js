/**
 * File Operations Extended - Chunk management and statistics
 * Handles chunk operations and file/chunk analytics
 */

export class FileOperationsExtended {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get chunks for a specific file
   * @param {string} fileId - File UUID
   * @param {Object} options - Query options
   * @returns {Array} Array of chunks
   */
  async getFileChunks(fileId, options = {}) {
    const { limit = 100, offset = 0 } = options;
    
    const query = `
      SELECT * FROM context.chunks 
      WHERE file_id = $1 
      ORDER BY chunk_index 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.connector.query(query, [fileId, limit, offset]);
    return result.rows;
  }

  /**
   * Create a chunk for a file
   * @param {Object} chunkData - Chunk data
   * @returns {Object} Created chunk
   */
  async createChunk(chunkData) {
    const {
      file_id,
      chunk_index,
      content,
      metadata = {},
      embedding = null
    } = chunkData;
    
    const query = `
      INSERT INTO context.chunks (
        file_id, chunk_index, content, metadata, embedding_vector, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, NOW()
      )
      RETURNING *
    `;
    
    const result = await this.connector.query(query, [
      file_id, chunk_index, content, metadata, embedding
    ]);
    
    return result.rows[0];
  }

  /**
   * Get file statistics for a client
   * @param {number} clientId - Client ID
   * @returns {Object} File and chunk statistics
   */
  async getFileStats(clientId) {
    const query = `
      SELECT 
        COUNT(DISTINCT f.id) as total_files,
        COUNT(c.id) as total_chunks,
        SUM(f.file_size) as total_size_bytes,
        AVG(f.file_size) as avg_file_size,
        COUNT(DISTINCT f.content_type) as unique_file_types,
        MAX(f.created_at) as last_upload,
        MIN(f.created_at) as first_upload
      FROM context.files f
      LEFT JOIN context.chunks c ON f.id = c.file_id
      WHERE f.client_id = $1
    `;
    
    const result = await this.connector.query(query, [clientId]);
    const stats = result.rows[0];
    
    // Get files by source type separately
    const sourceQuery = `
      SELECT source_type, COUNT(*) as count
      FROM context.files 
      WHERE client_id = $1 AND source_type IS NOT NULL
      GROUP BY source_type
    `;
    const sourceResult = await this.connector.query(sourceQuery, [clientId]);
    const files_by_source = {};
    sourceResult.rows.forEach(row => {
      files_by_source[row.source_type] = parseInt(row.count);
    });
    
    // Format statistics
    return {
      total_files: parseInt(stats.total_files) || 0,
      total_chunks: parseInt(stats.total_chunks) || 0,
      total_size_bytes: parseInt(stats.total_size_bytes) || 0,
      total_size_mb: stats.total_size_bytes ? 
        (parseInt(stats.total_size_bytes) / (1024 * 1024)).toFixed(2) : '0',
      avg_file_size_kb: stats.avg_file_size ? 
        (parseFloat(stats.avg_file_size) / 1024).toFixed(2) : '0',
      unique_file_types: parseInt(stats.unique_file_types) || 0,
      last_upload: stats.last_upload,
      first_upload: stats.first_upload,
      files_by_source: files_by_source
    };
  }
}