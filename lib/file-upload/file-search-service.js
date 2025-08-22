/**
 * File Search Service
 * Real implementation using DatabaseAgent for file operations
 */

import { DatabaseAgent } from '../database-agent.js';

export class FileSearchService {
  constructor() {
    this.dbAgent = new DatabaseAgent();
  }

  async searchFiles(query, limit = 10, clientId = null) {
    try {
      await this.dbAgent.connect();
      
      // Basic text search in filenames and content
      let files = [];
      if (clientId) {
        files = await this.dbAgent.files.getClientFiles(clientId);
      }
      
      // Filter files based on query (simple text matching for now)
      const filteredFiles = files.filter(file => 
        file.filename.toLowerCase().includes(query.toLowerCase()) ||
        (file.content_data && file.content_data.toString().toLowerCase().includes(query.toLowerCase()))
      );
      
      return filteredFiles.slice(0, limit);
    } catch (error) {
      console.error('File search failed:', error);
      throw error;
    } finally {
      await this.dbAgent.close();
    }
  }
  
  async getFileContent(fileId) {
    try {
      await this.dbAgent.connect();
      const file = await this.dbAgent.files.getFileWithContent(fileId);
      return file ? file.content_data : null;
    } catch (error) {
      console.error('Get file content failed:', error);
      throw error;
    } finally {
      await this.dbAgent.close();
    }
  }
}

export default FileSearchService;