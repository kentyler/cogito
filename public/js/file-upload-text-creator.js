/**
 * File Upload Text Creator Component
 * Handles text file creation functionality (extracted from file-upload-right-pane.js)
 */

class FileUploadTextCreator {
  constructor() {
    this.titleInput = null;
    this.contentTextarea = null;
  }

  renderTextCreator(container) {
    container.innerHTML = `
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

  getFormData() {
    return {
      title: this.titleInput?.value.trim() || '',
      content: this.contentTextarea?.value.trim() || ''
    };
  }

  validateForm() {
    const { title, content } = this.getFormData();
    return title && content;
  }
}

// Export singleton
window.fileUploadTextCreator = window.fileUploadTextCreator || new FileUploadTextCreator();