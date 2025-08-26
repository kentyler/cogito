/**
 * File Upload List Component
 * Displays uploaded files list with selection and deletion (replaces file_list.cljs)
 */

class FileUploadList {
  constructor() {
    this.container = null;
    this.unsubscribeFiles = null;
    this.unsubscribeSelected = null;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`File list container not found: ${containerId}`);
      return;
    }

    this.render();
    this.setupStateSubscriptions();
    this.loadFiles(); // Load files on init
  }

  render() {
    const files = window.fileUploadState.getFiles();
    const selectedFile = window.fileUploadState.getSelectedFile();

    this.container.innerHTML = `
      <div class="flex-1 overflow-y-auto">
        <h3 class="text-lg font-medium text-gray-900 mb-3">Uploaded Files</h3>
        ${files.length > 0 ? 
          `<div class="space-y-1">
            ${files.map(file => `
              <div class="flex items-center justify-between p-2 rounded hover:bg-gray-100 ${
                selectedFile && file.id === selectedFile.id ? 'bg-blue-50 border border-blue-200' : ''
              }">
                <button 
                  class="text-left text-blue-600 hover:text-blue-800 underline flex-1 text-sm"
                  onclick="window.fileUploadList.selectFile('${file.id}')">
                  ${this.escapeHtml(file.filename)}
                </button>
                <button 
                  class="ml-2 text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                  onclick="window.fileUploadList.deleteFile('${file.id}')"
                  ${window.fileUploadState.isDeleting(file.id) ? 'disabled' : ''}
                  title="Delete file">
                  ${window.fileUploadState.isDeleting(file.id) ? '⏳' : '×'}
                </button>
              </div>
            `).join('')}
          </div>` :
          '<p class="text-gray-500 text-sm">No files uploaded yet</p>'
        }
      </div>
    `;
  }

  setupStateSubscriptions() {
    // Subscribe to files changes
    this.unsubscribeFiles = window.fileUploadState.subscribe('files', () => {
      this.render();
    });

    // Subscribe to selected file changes
    this.unsubscribeSelected = window.fileUploadState.subscribe('selectedFile', () => {
      this.render();
    });
  }

  async loadFiles() {
    try {
      const files = await window.fileUploadAPI.loadFiles();
      window.fileUploadState.setFiles(files);
    } catch (error) {
      console.error('Failed to load files:', error);
      window.fileUploadState.setError('Failed to load files');
    }
  }

  async selectFile(fileId) {
    const files = window.fileUploadState.getFiles();
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
      console.error('File not found:', fileId);
      return;
    }

    try {
      // Set selected file immediately for UI feedback
      window.fileUploadState.setSelectedFile(file);
      
      // Load file content
      const fileWithContent = await window.fileUploadAPI.loadFileContent(fileId);
      window.fileUploadState.setSelectedFile(fileWithContent);
      
    } catch (error) {
      console.error('Failed to load file content:', error);
      window.fileUploadState.setError('Failed to load file content');
    }
  }

  async deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      window.fileUploadState.setDeleting(fileId, true);
      await window.fileUploadAPI.deleteFile(fileId);
      
      // Clear selected file if it was deleted
      const selectedFile = window.fileUploadState.getSelectedFile();
      if (selectedFile && selectedFile.id === fileId) {
        window.fileUploadState.setSelectedFile(null);
      }
      
      // Refresh file list
      await this.loadFiles();
      
    } catch (error) {
      console.error('Failed to delete file:', error);
      window.fileUploadState.setError('Failed to delete file');
      alert('Failed to delete file: ' + error.message);
    } finally {
      window.fileUploadState.setDeleting(fileId, false);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.unsubscribeFiles) {
      this.unsubscribeFiles();
    }
    if (this.unsubscribeSelected) {
      this.unsubscribeSelected();
    }
  }
}

// Export singleton
window.fileUploadList = window.fileUploadList || new FileUploadList();