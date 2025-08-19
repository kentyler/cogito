/**
 * File Search Service
 * Stub implementation for server startup
 */

export class FileSearchService {
  async searchFiles(query, limit = 10) {
    // Return empty results for now
    return [];
  }
  
  async getFileContent(fileId) {
    // Return empty content for now
    return null;
  }
}

export default FileSearchService;