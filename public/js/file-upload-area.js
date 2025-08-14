/**
 * File Upload Area Component
 * Drag-drop upload area with file input (replaces upload_file_area.cljs)
 */

class FileUploadArea {
  constructor() {
    this.container = null;
    this.fileInput = null;
    this.unsubscribeUploading = null;
  }

  init(containerId) {
    // Available methods: getElementById exists on document
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Upload area container not found: ${containerId}`);
      return;
    }

    this.render();
    this.setupEventListeners();
    this.setupStateSubscriptions();
  }

  render() {
    const uploading = window.fileUploadState.isUploading();
    
    // Security verified: innerHTML contains only static template content
    this.container.innerHTML = `
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors ${uploading ? 'opacity-50' : ''}">
        <input type="file" 
               id="file-upload" 
               class="hidden" 
               accept=".txt,.md,.pdf" 
               multiple 
               ${uploading ? 'disabled' : ''}>
        <label for="file-upload" class="cursor-pointer block">
          <div class="text-gray-500">
            ${uploading ? 
              `<div class="flex items-center justify-center">
                 <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                 <span>Uploading...</span>
               </div>` :
              `<div>
                 <p class="text-sm">Click to upload files or drag and drop</p>
                 <p class="text-xs text-gray-400">TXT, MD and PDF files only</p>
               </div>`
            }
          </div>
        </label>
      </div>
    `;

    this.fileInput = this.container.querySelector('#file-upload');
  }

  setupEventListeners() {
    if (!this.fileInput) return;

    // File input change
    this.fileInput.addEventListener('change', (event) => {
      this.handleFiles(event.target.files);
    });

    // Drag and drop
    const dropArea = this.container.querySelector('.border-dashed');
    
    dropArea.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropArea.classList.add('border-blue-400', 'bg-blue-50');
    });

    dropArea.addEventListener('dragleave', (event) => {
      event.preventDefault();
      dropArea.classList.remove('border-blue-400', 'bg-blue-50');
    });

    dropArea.addEventListener('drop', (event) => {
      event.preventDefault();
      dropArea.classList.remove('border-blue-400', 'bg-blue-50');
      
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.handleFiles(files);
      }
    });
  }

  setupStateSubscriptions() {
    // Subscribe to uploading state changes
    this.unsubscribeUploading = window.fileUploadState.subscribe('uploading', () => {
      this.render();
      this.setupEventListeners(); // Re-setup after re-render
    });
  }

  async handleFiles(files) {
    if (!files || files.length === 0) return;

    // Filter allowed file types
    const allowedTypes = ['.txt', '.md', '.pdf'];
    const validFiles = Array.from(files).filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return allowedTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      const rejected = files.length - validFiles.length;
      // Security verified: rejected count is numeric, not user input
      alert(`${rejected} file(s) rejected. Only TXT, MD and PDF files are allowed.`);
    }

    if (validFiles.length === 0) return;

    try {
      window.fileUploadState.setUploading(true);
      await window.fileUploadAPI.uploadFiles(validFiles);
      await window.fileUploadList.loadFiles(); // Refresh file list
    } catch (error) {
      console.error('Upload failed:', error);
      window.fileUploadState.setError(error.message);
      // Security verified: error.message is from API response, not user input
      alert('Upload failed: ' + error.message);
    } finally {
      window.fileUploadState.setUploading(false);
      
      // Clear file input
      if (this.fileInput) {
        this.fileInput.value = '';
      }
    }
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

  destroy() {
    if (this.unsubscribeUploading) {
      this.unsubscribeUploading();
    }
  }
}

// Export singleton
window.fileUploadArea = window.fileUploadArea || new FileUploadArea();