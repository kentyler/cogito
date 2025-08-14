/**
 * File Upload Right Pane Component
 * File content viewer and text creator form (replaces upload_files_right_pane.cljs)
 */

class FileUploadRightPane {
  constructor() {
    this.container = null;
    this.unsubscribeSelected = null;
    this.unsubscribeShowCreator = null;
    this.titleInput = null;
    this.contentTextarea = null;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Right pane container not found: ${containerId}`);
      return;
    }

    this.render();
    this.setupStateSubscriptions();
  }

  render() {
    const selectedFile = window.fileUploadState.getSelectedFile();
    const showTextCreator = window.fileUploadState.getShowTextCreator();

    if (showTextCreator) {
      this.renderTextCreator();
    } else if (selectedFile) {
      this.renderFileContent(selectedFile);
    } else {
      this.renderEmptyState();
    }
  }

  renderTextCreator() {
    this.container.innerHTML = `
      <div class="p-4">
        <div class="mb-4 pb-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Create New Text File</h3>
          <p class="text-sm text-gray-500">Enter a filename and paste your content below</p>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Filename</label>
          <input 
            type="text" 
            id="filename-input"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter filename (e.g., my-document.txt)">
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <textarea 
            id="content-textarea"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Paste your text content here..."
            rows="20"></textarea>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button 
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
            onclick="window.fileUploadRightPane.hideTextCreator()">
            Cancel
          </button>
          <button 
            id="create-file-btn"
            class="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            onclick="window.fileUploadRightPane.createTextFile()">
            Create File
          </button>
        </div>
      </div>
    `;

    // Store references and setup validation
    this.titleInput = document.getElementById('filename-input');
    this.contentTextarea = document.getElementById('content-textarea');
    this.setupTextCreatorValidation();
  }

  renderFileContent(file) {
    const uploadDate = new Date(file.uploaded_at).toLocaleDateString();
    const sizeText = file.size ? `${Math.round(file.size / 1024)}KB` : '';

    this.container.innerHTML = `
      <div class="p-4">
        <div class="mb-4 pb-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">${this.escapeHtml(file.filename)}</h3>
          <p class="text-sm text-gray-500">
            Uploaded: ${uploadDate}${sizeText ? ` • ${sizeText}` : ''}
          </p>
        </div>
        
        <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
          ${this.escapeHtml(file.content || 'Loading content...')}
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="flex items-center justify-center h-full text-gray-500">
        <div class="text-center">
          <p class="text-lg mb-2">No file selected</p>
          <p class="text-sm">Select a file from the left panel to view its content</p>
        </div>
      </div>
    `;
  }

  setupTextCreatorValidation() {
    if (!this.titleInput || !this.contentTextarea) return;

    const validateForm = () => {
      const createBtn = document.getElementById('create-file-btn');
      const hasTitle = this.titleInput.value.trim().length > 0;
      const hasContent = this.contentTextarea.value.trim().length > 0;
      
      if (createBtn) {
        createBtn.disabled = !hasTitle || !hasContent;
      }
    };

    this.titleInput.addEventListener('input', validateForm);
    this.contentTextarea.addEventListener('input', validateForm);
    validateForm(); // Initial validation
  }

  setupStateSubscriptions() {
    // Subscribe to selected file changes
    this.unsubscribeSelected = window.fileUploadState.subscribe('selectedFile', () => {
      this.render();
    });

    // Subscribe to show text creator changes
    this.unsubscribeShowCreator = window.fileUploadState.subscribe('showTextCreator', () => {
      this.render();
    });
  }

  showTextCreator() {
    window.fileUploadState.setShowTextCreator(true);
  }

  hideTextCreator() {
    window.fileUploadState.setShowTextCreator(false);
  }

  async createTextFile() {
    if (!this.titleInput || !this.contentTextarea) return;

    const title = this.titleInput.value.trim();
    const content = this.contentTextarea.value.trim();

    if (!title || !content) {
      alert('Please provide both filename and content');
      return;
    }

    try {
      window.fileUploadState.setUploading(true);
      const fileData = await window.fileUploadAPI.createTextFile(title, content);
      
      // Update state
      window.fileUploadState.setShowTextCreator(false);
      window.fileUploadState.setSelectedFile(fileData);
      
      // Refresh file list
      await window.fileList.loadFiles();
      
    } catch (error) {
      console.error('Failed to create text file:', error);
      window.fileUploadState.setError('Failed to create text file');
      alert('Failed to create text file: ' + error.message);
    } finally {
      window.fileUploadState.setUploading(false);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.unsubscribeSelected) {
      this.unsubscribeSelected();
    }
    if (this.unsubscribeShowCreator) {
      this.unsubscribeShowCreator();
    }
  }
}

// Export singleton
window.fileUploadRightPane = window.fileUploadRightPane || new FileUploadRightPane();