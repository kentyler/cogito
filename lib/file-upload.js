/**
 * File Upload Service for Cogito
 * Handles file uploads, content extraction, chunking, and vectorization
 * Adapted from backstage project for Cogito's unified database
 */

import fs from 'fs';
import { fileTypeFromFile } from 'file-type';
import OpenAI from 'openai';
import pg from 'pg';
const { Pool } = pg;

export class FileUploadService {
  constructor() {
    // Use same Supabase connection as Cogito
    this.pool = new Pool({
      connectionString: 'postgresql://user:password@host/database',
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Initialize OpenAI client for embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Track files being processed
    this.processingFiles = new Set();
  }

  /**
   * Create a new file upload record
   * @param {Object} uploadData - The upload data
   * @param {number} clientId - Client ID (default: 6 for Cogito)
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
        INSERT INTO file_uploads 
        (filename, mime_type, file_path, file_size, public_url, bucket_name, description, tags, client_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *
      `, [
        filename,
        mimeType,
        filePath,
        fileSize || null,
        publicUrl || null,
        bucketName || 'public',
        description || null,
        tags || null,
        clientId
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating file upload:', error);
      throw new Error(`Failed to create file upload: ${error.message}`);
    }
  }

  /**
   * Process a file and store it with vectors
   * @param {Object} fileData - File data from upload
   * @param {Object} options - Processing options
   * @param {number} options.clientId - Client ID (default: 6)
   * @param {string} options.description - File description
   * @param {string[]} options.tags - File tags
   * @param {boolean} options.skipVectorization - Skip vectorization
   */
  async processFile(fileData, options = {}) {
    const {
      clientId = 6,
      description = null,
      tags = null,
      skipVectorization = false
    } = options;

    let fileUpload = null;

    try {
      // Detect file type
      const detectedType = await fileTypeFromFile(fileData.path);
      const mimeType = detectedType?.mime || fileData.mimetype;
      
      // Generate storage path
      const timestamp = Date.now();
      const safeName = fileData.originalname.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const filename = `${timestamp}-${safeName}`;
      const storagePath = `uploads/${filename}`;
      
      // Create file upload record
      fileUpload = await this.createFileUpload({
        filename: fileData.originalname,
        mimeType,
        filePath: storagePath,
        fileSize: fileData.size,
        publicUrl: null, // Could add storage integration later
        bucketName: 'public',
        description,
        tags
      }, clientId);

      console.log(`File upload created with ID: ${fileUpload.id}`);

      // Start vectorization if not skipped
      if (!skipVectorization && fileUpload) {
        // Process in background
        setTimeout(() => {
          this.extractAndVectorizeContent(
            fileData.path,
            fileUpload.id,
            mimeType,
            clientId
          ).catch(error => {
            console.error(`Error vectorizing file ${fileUpload.id}:`, error);
          });
        }, 1000);
      }

      return fileUpload;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  /**
   * Extract content and create vector embeddings
   */
  async extractAndVectorizeContent(filePath, fileId, mimeType, clientId = 6) {
    if (this.processingFiles.has(fileId)) {
      console.log(`File ${fileId} already being processed`);
      return;
    }

    this.processingFiles.add(fileId);

    try {
      // Extract text content
      let textContent = '';
      
      if (mimeType.startsWith('text/') || mimeType === 'application/json') {
        textContent = await fs.promises.readFile(filePath, 'utf8');
      } else if (mimeType === 'application/pdf') {
        console.log('PDF processing not implemented yet');
        return;
      } else {
        console.log(`Unsupported file type: ${mimeType}`);
        return;
      }

      if (!textContent || textContent.trim().length === 0) {
        console.log(`No text content in file ${fileId}`);
        return;
      }

      // Chunk the content
      const chunks = this.chunkText(textContent, 1000, 200);
      console.log(`Created ${chunks.length} chunks for file ${fileId}`);

      // Create embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding using OpenAI
        let embedding = null;
        try {
          const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk,
            dimensions: 1536
          });
          embedding = response.data[0].embedding;
        } catch (error) {
          console.error(`Error generating embedding for chunk ${i}:`, error);
          // Continue without embedding
        }

        // Store chunk with vector
        await this.pool.query(`
          INSERT INTO file_upload_vectors 
          (file_upload_id, chunk_index, content_text, content_vector, client_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          fileId,
          i,
          chunk,
          embedding ? JSON.stringify(embedding) : null,
          clientId
        ]);
      }

      console.log(`Successfully vectorized file ${fileId}`);
    } finally {
      this.processingFiles.delete(fileId);
    }
  }

  /**
   * Split text into overlapping chunks
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
      
      start = end - overlap;
      if (start <= 0) start = end;
    }
    
    return chunks;
  }

  /**
   * Search file content using vector similarity
   * @param {string} query - Search query
   * @param {number} clientId - Client ID
   * @param {number} limit - Number of results
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
          fv.id,
          fv.file_upload_id,
          fv.chunk_index,
          fv.content_text,
          f.filename,
          f.description,
          f.tags,
          fv.content_vector <=> $1::vector as distance
        FROM file_upload_vectors fv
        JOIN file_uploads f ON f.id = fv.file_upload_id
        WHERE fv.client_id = $2 AND fv.content_vector IS NOT NULL
        ORDER BY distance
        LIMIT $3
      `, [JSON.stringify(queryEmbedding), clientId, limit]);

      return results.rows;
    } catch (error) {
      console.error('Error searching file content:', error);
      throw error;
    }
  }

  /**
   * Delete a file upload and its vectors
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
   * Get file upload by ID
   */
  async getFileUploadById(fileId, clientId = 6) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM file_uploads WHERE id = $1 AND client_id = $2',
        [fileId, clientId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting file upload:', error);
      throw error;
    }
  }

  /**
   * List file uploads for a client
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
}

// Export singleton instance
export const fileUploadService = new FileUploadService();