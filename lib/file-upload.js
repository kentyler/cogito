/**
 * File Upload Service - Modular version with specialized components
 * 
 * Handles file uploads, content extraction, chunking, and vectorization
 * Adapted from backstage project for Cogito's unified database
 */

import { FileUploadManager } from './file-upload/file-upload-manager.js';
import { ContentExtractor } from './file-upload/content-extractor.js';
import { TextChunker } from './file-upload/text-chunker.js';
import { VectorEmbeddingService } from './file-upload/vector-embedding-service.js';
import { FileSearchService } from './file-upload/file-search-service.js';
import { FileProcessor } from './file-upload/file-processor.js';

export class FileUploadService {
  constructor() {
    // Initialize specialized modules
    this.uploadManager = new FileUploadManager();
    this.contentExtractor = new ContentExtractor();
    this.textChunker = new TextChunker();
    this.vectorService = new VectorEmbeddingService();
    this.searchService = new FileSearchService();
    this.fileProcessor = new FileProcessor(this.uploadManager, this.contentExtractor, this.vectorService);
  }

  /**
   * Create a new file upload record
   * @param {Object} uploadData - The upload data
   * @param {number} clientId - Client ID (default: 6 for Cogito)
   * @returns {Object} - Created file upload record
   */
  async createFileUpload(uploadData, clientId = 6) {
    return await this.uploadManager.createFileUpload(uploadData, clientId);
  }

  /**
   * Process a file and store it with vectors
   * @param {Object} fileData - File data from upload
   * @param {Object} options - Processing options
   * @returns {Object} - Created file upload record
   */
  async processFile(fileData, options = {}) {
    return await this.fileProcessor.processFile(fileData, options);
  }

  /**
   * Extract content and create vector embeddings
   * @param {string} filePath - Path to the file
   * @param {number} fileId - File upload ID
   * @param {string} mimeType - MIME type of the file
   * @param {number} clientId - Client ID
   */
  async extractAndVectorizeContent(filePath, fileId, mimeType, clientId = 6) {
    return await this.fileProcessor.extractAndVectorizeContent(filePath, fileId, mimeType, clientId);
  }

  /**
   * Create file from content string (for pseudo-files)
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   * @param {string} description - File description
   * @param {number} createdByUserId - User ID who created the file
   * @param {number} clientId - Client ID
   * @returns {Object} - Created file upload record
   */
  async createFileFromContent(content, filename, mimeType, description, createdByUserId, clientId = 6) {
    try {
      // Create file upload record
      const fileUpload = await this.uploadManager.createFileUpload({
        filename,
        mimeType,
        filePath: null, // No physical file
        fileSize: Buffer.byteLength(content, 'utf8'),
        publicUrl: null,
        bucketName: 'virtual',
        description,
        tags: null
      }, clientId);

      // Create chunks and vectors directly from content
      const chunks = this.textChunker.chunkOptimal(content, 1000, 200);
      if (chunks.length > 0) {
        await this.vectorService.processChunksToVectors(chunks, fileUpload.id, clientId);
      }

      return fileUpload;
    } catch (error) {
      console.error('Error creating file from content:', error);
      throw error;
    }
  }

  /**
   * Search file content using vector similarity
   * @param {string} query - Search query
   * @param {number} clientId - Client ID
   * @param {number} limit - Number of results
   * @returns {Array} - Array of search results
   */
  async searchFileContent(query, clientId = 6, limit = 10) {
    return await this.searchService.searchFileContent(query, clientId, limit);
  }

  /**
   * Get file upload by ID
   * @param {number} fileId - File ID
   * @param {number} clientId - Client ID
   * @returns {Object|null} - File upload record or null
   */
  async getFileUploadById(fileId, clientId = 6) {
    return await this.uploadManager.getFileUploadById(fileId, clientId);
  }

  /**
   * List file uploads for a client
   * @param {number} clientId - Client ID
   * @param {Object} options - Query options
   * @returns {Array} - Array of file upload records
   */
  async listFileUploads(clientId = 6, options = {}) {
    return await this.uploadManager.listFileUploads(clientId, options);
  }

  /**
   * Delete a file upload and its vectors
   * @param {number} fileId - File ID
   * @param {number} clientId - Client ID
   * @returns {Object} - Deleted file upload record
   */
  async deleteFileUpload(fileId, clientId = 6) {
    // Delete vectors first
    await this.vectorService.deleteFileVectors(fileId, clientId);
    
    // Delete file upload record
    return await this.uploadManager.deleteFileUpload(fileId, clientId);
  }

  /**
   * Convenience method to get access to specialized modules
   */
  get modules() {
    return {
      uploadManager: this.uploadManager,
      contentExtractor: this.contentExtractor,
      textChunker: this.textChunker,
      vectorService: this.vectorService,
      searchService: this.searchService
    };
  }

  /**
   * Legacy method - split text into overlapping chunks
   * @deprecated Use textChunker.chunkText() instead
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    return this.textChunker.chunkText(text, chunkSize, overlap);
  }

  /**
   * Close all database connections
   */
  async close() {
    await Promise.all([
      this.uploadManager.close(),
      this.vectorService.close(),
      this.searchService.close()
    ]);
  }
}

// Export singleton instance for backward compatibility
export const fileUploadService = new FileUploadService();