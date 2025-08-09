/**
 * File Upload Manager - Create and manage file upload records
 * Uses DatabaseAgent for centralized file operations
 */

import { DatabaseAgent } from '../database-agent.js';

export class FileUploadManager {
  constructor() {
    this.dbAgent = new DatabaseAgent();
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
      tags,
      fileContent
    } = uploadData;

    try {
      await this.dbAgent.connect();
      
      const fileData = {
        filename,
        content_type: mimeType,
        content_data: fileContent || '',
        file_size: fileSize || 0,
        source_type: 'upload',
        client_id: clientId,
        metadata: {
          description: description || null,
          tags: tags || null,
          client_id: clientId,
          original_path: filePath,
          public_url: publicUrl,
          bucket_name: bucketName
        }
      };

      const result = await this.dbAgent.files.createFile(fileData);
      return result;
      
    } catch (error) {
      console.error('Error creating file upload:', error);
      throw new Error(`Failed to create file upload: ${error.message}`);
    } finally {
      await this.dbAgent.close();
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
      await this.dbAgent.connect();
      const file = await this.dbAgent.files.getFileById(fileId, clientId);
      return file;
    } catch (error) {
      console.error('Error getting file upload:', error);
      throw error;
    } finally {
      await this.dbAgent.close();
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
      await this.dbAgent.connect();
      
      // Get basic file list
      const files = await this.dbAgent.files.getClientFiles(clientId);
      
      // Filter by tags if provided
      let filteredFiles = files;
      if (tags && tags.length > 0) {
        filteredFiles = files.filter(file => {
          const fileTags = file.metadata?.tags || [];
          return tags.some(tag => fileTags.includes(tag));
        });
      }
      
      // Apply pagination
      const paginatedFiles = filteredFiles.slice(offset, offset + limit);
      
      return paginatedFiles;
      
    } catch (error) {
      console.error('Error listing file uploads:', error);
      throw error;
    } finally {
      await this.dbAgent.close();
    }
  }

  /**
   * Delete a file upload and its chunks
   * @param {number} fileId - File ID
   * @param {number} clientId - Client ID
   * @returns {Object} - Deleted file upload record
   */
  async deleteFileUpload(fileId, clientId = 6) {
    try {
      await this.dbAgent.connect();
      const result = await this.dbAgent.files.deleteFile(fileId, clientId);
      return result.file;
    } catch (error) {
      if (error.message.includes('File not found or access denied')) {
        throw new Error('File not found');
      }
      console.error('Error deleting file upload:', error);
      throw error;
    } finally {
      await this.dbAgent.close();
    }
  }

  /**
   * Get file upload statistics for a client
   * @param {number} clientId - Client ID
   * @returns {Object} - File statistics
   */
  async getUploadStats(clientId = 6) {
    try {
      await this.dbAgent.connect();
      const stats = await this.dbAgent.files.getFileStats(clientId);
      return stats;
    } catch (error) {
      console.error('Error getting upload stats:', error);
      throw error;
    } finally {
      await this.dbAgent.close();
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.dbAgent.close();
  }
}