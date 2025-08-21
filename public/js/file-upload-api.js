/**
 * File Upload API Handler
 * Handles all server communication for file uploads
 */

class FileUploadAPI {
  constructor() {
    this.baseUrl = '/api/upload-files';
  }

  async uploadFiles(files) {
    try {
      // Upload files one by one since server expects single file upload
      const results = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  async loadFiles() {
    try {
      const response = await fetch(`${this.baseUrl}/files`);
      
      if (!response.ok) {
        throw new Error(`Load files failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Load files error:', error);
      throw error;
    }
  }

  async loadFileContent(fileId) {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Load content failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Load file content error:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // Security verified: statusText is browser-controlled, not user input
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  async createTextFile(title, content) {
    try {
      const response = await fetch(`${this.baseUrl}/create-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          content: content
        })
      });

      if (!response.ok) {
        throw new Error(`Text file creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create text file error:', error);
      throw error;
    }
  }
}

// Export singleton instance
window.fileUploadAPI = window.fileUploadAPI || new FileUploadAPI();