/**
 * Vector Embedding Service - Generate and store vector embeddings
 */

import OpenAI from 'openai';
import pg from 'pg';
const { Pool } = pg;

export class VectorEmbeddingService {
  constructor() {
    // Initialize OpenAI client for embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Database connection for storing vectors
    this.pool = new Pool({
      connectionString: 'postgresql://postgres.hpdbaeurycyhqigiatco:9%fJP-p5jjH-*.a@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Track files being processed to avoid duplicates
    this.processingFiles = new Set();
  }

  /**
   * Generate vector embedding for text
   * @param {string} text - Text to embed
   * @param {string} model - OpenAI embedding model
   * @param {number} dimensions - Embedding dimensions
   * @returns {Array} - Vector embedding
   */
  async generateEmbedding(text, model = 'text-embedding-3-small', dimensions = 1536) {
    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text,
        dimensions
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Store text chunk with vector embedding
   * @param {number} fileId - File upload ID
   * @param {number} chunkIndex - Index of the chunk
   * @param {string} content - Text content
   * @param {Array} embedding - Vector embedding
   * @param {number} clientId - Client ID
   */
  async storeChunkVector(fileId, chunkIndex, content, embedding, clientId = 6) {
    try {
      await this.pool.query(`
        INSERT INTO file_upload_vectors 
        (file_upload_id, chunk_index, content_text, content_vector, client_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        fileId,
        chunkIndex,
        content,
        embedding ? JSON.stringify(embedding) : null,
        clientId
      ]);
    } catch (error) {
      console.error('Error storing chunk vector:', error);
      throw new Error(`Failed to store chunk vector: ${error.message}`);
    }
  }

  /**
   * Process chunks and create embeddings
   * @param {Array} chunks - Array of text chunks
   * @param {number} fileId - File upload ID
   * @param {number} clientId - Client ID
   */
  async processChunksToVectors(chunks, fileId, clientId = 6) {
    if (this.processingFiles.has(fileId)) {
      console.log(`File ${fileId} already being processed`);
      return;
    }

    this.processingFiles.add(fileId);

    try {
      console.log(`Processing ${chunks.length} chunks for file ${fileId}`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding
        let embedding = null;
        try {
          embedding = await this.generateEmbedding(chunk);
        } catch (error) {
          console.error(`Error generating embedding for chunk ${i}:`, error);
          // Continue without embedding - store text only
        }

        // Store chunk with vector
        await this.storeChunkVector(fileId, i, chunk, embedding, clientId);
      }

      console.log(`Successfully vectorized file ${fileId}`);
    } finally {
      this.processingFiles.delete(fileId);
    }
  }

  /**
   * Get vector embeddings for a file
   * @param {number} fileId - File upload ID
   * @param {number} clientId - Client ID
   * @returns {Array} - Array of vector records
   */
  async getFileVectors(fileId, clientId = 6) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM file_upload_vectors 
        WHERE file_upload_id = $1 AND client_id = $2
        ORDER BY chunk_index
      `, [fileId, clientId]);

      return result.rows;
    } catch (error) {
      console.error('Error getting file vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors for a file
   * @param {number} fileId - File upload ID
   * @param {number} clientId - Client ID
   */
  async deleteFileVectors(fileId, clientId = 6) {
    try {
      await this.pool.query(`
        DELETE FROM file_upload_vectors 
        WHERE file_upload_id = $1 AND client_id = $2
      `, [fileId, clientId]);

      console.log(`Deleted vectors for file ${fileId}`);
    } catch (error) {
      console.error('Error deleting file vectors:', error);
      throw error;
    }
  }

  /**
   * Check if file is currently being processed
   * @param {number} fileId - File upload ID
   * @returns {boolean} - True if being processed
   */
  isProcessing(fileId) {
    return this.processingFiles.has(fileId);
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}