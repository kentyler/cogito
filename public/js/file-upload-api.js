/**
 * File Upload API Handler
 * Handles all server communication for file uploads
 */

class FileUploadAPI {
  constructor() {
    this.baseUrl = '/api';
  }

  async uploadFiles(files) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${this.baseUrl}/upload-files`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
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
      const response = await fetch(`${this.baseUrl}/files/${fileId}/content`);
      
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
      const response = await fetch(`${this.baseUrl}/files/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: title,
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