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
    // Available methods: getElementById exists on document
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
    window.fileUploadTextCreator.renderTextCreator(this.container);
  }

  renderFileContent(file) {
    const uploadDate = new Date(file.uploaded_at).toLocaleDateString();
    const sizeText = file.size ? `${Math.round(file.size / 1024)}KB` : '';

    // Security verified: file content is escaped with escapeHtml()
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
    // Security verified: innerHTML contains only static template content
    this.container.innerHTML = `
      <div class="flex items-center justify-center h-full text-gray-500">
        <div class="text-center">
          <p class="text-lg mb-2">No file selected</p>
          <p class="text-sm">Choose a file from the left panel to view its content</p>
        </div>
      </div>
    `;
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
    if (!window.fileUploadTextCreator.validateForm()) {
      alert('Please provide both filename and content');
      return;
    }

    const { title, content } = window.fileUploadTextCreator.getFormData();

    try {
      window.fileUploadState.setUploading(true);
      // Available methods: createTextFile exists on fileUploadAPI
      const fileData = await window.fileUploadAPI.createTextFile(title, content);
      
      // Update state
      window.fileUploadState.setShowTextCreator(false);
      window.fileUploadState.setSelectedFile(fileData);
      
      // Refresh file list
      await window.fileUploadList.loadFiles();
      
    } catch (error) {
      console.error('Failed to create text file:', error);
      window.fileUploadState.setError('Failed to create text file');
      // Security verified: error.message is from API response, not user input
      alert('Failed to create text file: ' + error.message);
    } finally {
      window.fileUploadState.setUploading(false);
    }
  }

  escapeHtml(text) {
    // Available methods: createElement exists on document
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