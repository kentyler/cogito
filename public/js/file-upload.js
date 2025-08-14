/**
 * File Upload Main Component
 * Coordinates all file upload functionality and layout (replaces upload_files_left_pane.cljs)
 */

class FileUpload {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    console.log('Initializing File Upload functionality...');
    
    try {
      // Initialize all components
      this.setupLayout();
      this.initializeComponents();
      this.setupTextCreatorButton();
      
      this.initialized = true;
      console.log('✅ File Upload initialized successfully');
      
    } catch (error) {
      console.error('❌ File Upload initialization failed:', error);
    }
  }

  setupLayout() {
    // Find the upload files content area
    const uploadContent = document.getElementById('upload-files-content');
    if (!uploadContent) {
      throw new Error('Upload files content area not found');
    }

    // Create the layout structure
    uploadContent.innerHTML = `
      <div class="flex h-full">
        <!-- Left Panel -->
        <div class="w-1/2 pr-4 border-r border-gray-200">
          <div class="flex flex-col h-full">
            <!-- Header and Upload Area -->
            <div class="mb-4">
              <h2 class="text-xl font-semibold mb-2">Upload Files</h2>
              <p class="text-sm text-gray-600 mb-4">Upload .txt, .md and .pdf files for content analysis</p>
              <div id="file-upload-area"></div>
            </div>
            
            <!-- Text Creator Button -->
            <div class="mb-4">
              <button 
                id="show-text-creator-btn"
                class="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Create New Text File
              </button>
            </div>
            
            <!-- File List -->
            <div id="file-list-container" class="flex-1"></div>
          </div>
        </div>
        
        <!-- Right Panel -->
        <div class="w-1/2 pl-4">
          <div id="file-upload-right-pane" class="h-full"></div>
        </div>
      </div>
    `;
  }

  initializeComponents() {
    // Initialize upload area
    window.fileUploadArea.init('file-upload-area');
    
    // Initialize file list
    window.fileList.init('file-list-container');
    
    // Initialize right pane
    window.fileUploadRightPane.init('file-upload-right-pane');
  }

  setupTextCreatorButton() {
    const textCreatorBtn = document.getElementById('show-text-creator-btn');
    if (textCreatorBtn) {
      textCreatorBtn.addEventListener('click', () => {
        window.fileUploadRightPane.showTextCreator();
      });
    }
  }

  // Called when switching away from upload files tab
  destroy() {
    console.log('Cleaning up File Upload components...');
    
    try {
      // Clean up components
      if (window.fileUploadArea) {
        window.fileUploadArea.destroy();
      }
      if (window.fileList) {
        window.fileList.destroy();
      }
      if (window.fileUploadRightPane) {
        window.fileUploadRightPane.destroy();
      }
      
      // Reset state
      if (window.fileUploadState) {
        window.fileUploadState.reset();
      }
      
      this.initialized = false;
      
    } catch (error) {
      console.error('Error during File Upload cleanup:', error);
    }
  }

  // Get current state for debugging
  getState() {
    return {
      initialized: this.initialized,
      files: window.fileUploadState?.getFiles() || [],
      selectedFile: window.fileUploadState?.getSelectedFile() || null,
      uploading: window.fileUploadState?.isUploading() || false,
      showTextCreator: window.fileUploadState?.getShowTextCreator() || false
    };
  }
}

// Export singleton
window.fileUpload = window.fileUpload || new FileUpload();