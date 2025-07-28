/**
 * File Search Service - Search file content using vector similarity
 */

import OpenAI from 'openai';
import pg from 'pg';
const { Pool } = pg;

export class FileSearchService {
  constructor() {
    // Initialize OpenAI client for query embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Database connection for searching vectors
    this.pool = new Pool({
      connectionString: 'postgresql://postgres.hpdbaeurycyhqigiatco:9%fJP-p5jjH-*.a@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Search file content using vector similarity
   * @param {string} query - Search query
   * @param {number} clientId - Client ID
   * @param {number} limit - Number of results
   * @returns {Array} - Array of search results with similarity scores
   */
  async searchFileContent(query, clientId = 6, limit = 10) {
    try {
      // Generate embedding for query
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536
      });
      const queryEmbedding = response.data[0].embedding;

      // Search using pgvector
      const results = await this.pool.query(`
        SELECT 
          c.id,
          c.file_id,
          c.chunk_index,
          c.content as content_text,
          f.filename,
          f.metadata->>'description' as description,
          f.metadata->>'tags' as tags,
          c.embedding_vector <=> $1::vector as distance
        FROM context.chunks c
        JOIN context.files f ON f.id = c.file_id
        WHERE f.metadata->>'client_id' = $2 AND c.embedding_vector IS NOT NULL
        ORDER BY distance
        LIMIT $3
      `, [JSON.stringify(queryEmbedding), clientId, limit]);

      return results.rows.map(row => ({
        ...row,
        similarity: 1 - row.distance // Convert distance to similarity score
      }));
    } catch (error) {
      console.error('Error searching file content:', error);
      throw error;
    }
  }

  /**
   * Search within a specific file
   * @param {string} query - Search query
   * @param {number} fileId - File ID to search within
   * @param {number} clientId - Client ID
   * @param {number} limit - Number of results
   * @returns {Array} - Array of search results
   */
  async searchWithinFile(query, fileId, clientId = 6, limit = 5) {
    try {
      // Generate embedding for query
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536
      });
      const queryEmbedding = response.data[0].embedding;

      // Search within specific file
      const results = await this.pool.query(`
        SELECT 
          c.id,
          c.file_id,
          c.chunk_index,
          c.content as content_text,
          c.embedding_vector <=> $1::vector as distance
        FROM context.chunks c
        JOIN context.files f ON f.id = c.file_id
        WHERE c.file_id = $2 AND f.metadata->>'client_id' = $3 AND c.embedding_vector IS NOT NULL
        ORDER BY distance
        LIMIT $4
      `, [JSON.stringify(queryEmbedding), fileId, clientId, limit]);

      return results.rows.map(row => ({
        ...row,
        similarity: 1 - row.distance
      }));
    } catch (error) {
      console.error('Error searching within file:', error);
      throw error;
    }
  }

  /**
   * Get similar content chunks
   * @param {string} content - Content to find similar chunks for
   * @param {number} clientId - Client ID
   * @param {number} limit - Number of results
   * @param {number} excludeFileId - File ID to exclude from results
   * @returns {Array} - Array of similar content chunks
   */
  async findSimilarContent(content, clientId = 6, limit = 5, excludeFileId = null) {
    try {
      // Generate embedding for content
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content,
        dimensions: 1536
      });
      const contentEmbedding = response.data[0].embedding;

      let query = `
        SELECT 
          fv.id,
          fv.file_upload_id,
          fv.chunk_index,
          fv.content_text,
          f.filename,
          fv.content_vector <=> $1::vector as distance
        FROM file_upload_vectors fv
        JOIN files.file_uploads f ON f.id = fv.file_upload_id
        WHERE fv.client_id = $2 AND fv.content_vector IS NOT NULL
      `;
      
      const params = [JSON.stringify(contentEmbedding), clientId];
      
      // Exclude specific file if requested
      if (excludeFileId) {
        query += ` AND fv.file_upload_id != $${params.length + 1}`;
        params.push(excludeFileId);
      }
      
      query += ` ORDER BY distance LIMIT $${params.length + 1}`;
      params.push(limit);

      const results = await this.pool.query(query, params);

      return results.rows.map(row => ({
        ...row,
        similarity: 1 - row.distance
      }));
    } catch (error) {
      console.error('Error finding similar content:', error);
      throw error;
    }
  }

  /**
   * Search by tags
   * @param {Array} tags - Tags to search for
   * @param {number} clientId - Client ID
   * @param {number} limit - Number of results
   * @returns {Array} - Array of files matching tags
   */
  async searchByTags(tags, clientId = 6, limit = 10) {
    try {
      const results = await this.pool.query(`
        SELECT DISTINCT f.*, 
               jsonb_array_length(f.metadata->'tags') as tag_matches
        FROM context.files f
        WHERE f.metadata->>'client_id' = $2 AND f.metadata->'tags' ?| $1
        ORDER BY tag_matches DESC, f.created_at DESC
        LIMIT $3
      `, [tags, clientId, limit]);

      return results.rows;
    } catch (error) {
      console.error('Error searching by tags:', error);
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