/**
 * File Upload State Management
 * Manages upload files state and subscriptions (replaces re-frame state)
 */

class FileUploadState {
  constructor() {
    this.state = {
      files: [],
      selectedFile: null,
      uploading: false,
      showTextCreator: false,
      error: null,
      deleting: {}
    };
    this.listeners = {
      files: [],
      selectedFile: [],
      uploading: [],
      showTextCreator: [],
      error: []
    };
  }

  // State getters (subscriptions)
  getFiles() {
    return this.state.files || [];
  }

  getSelectedFile() {
    return this.state.selectedFile;
  }

  isUploading() {
    return this.state.uploading || false;
  }

  getShowTextCreator() {
    return this.state.showTextCreator || false;
  }

  getError() {
    return this.state.error;
  }

  isDeleting(fileId) {
    return this.state.deleting[fileId] || false;
  }

  // State setters with listeners
  setFiles(files) {
    this.state.files = files;
    this.notifyListeners('files');
  }

  setSelectedFile(file) {
    this.state.selectedFile = file;
    this.notifyListeners('selectedFile');
  }

  setUploading(uploading) {
    this.state.uploading = uploading;
    this.notifyListeners('uploading');
  }

  setShowTextCreator(show) {
    this.state.showTextCreator = show;
    this.notifyListeners('showTextCreator');
  }

  setError(error) {
    this.state.error = error;
    this.notifyListeners('error');
  }

  setDeleting(fileId, deleting) {
    this.state.deleting[fileId] = deleting;
    this.notifyListeners('deleting');
  }

  // Listener management (like re-frame subscriptions)
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  notifyListeners(key) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(this.state[key]));
    }
  }

  // Reset state
  reset() {
    this.state = {
      files: [],
      selectedFile: null,
      uploading: false,
      showTextCreator: false,
      error: null,
      deleting: {}
    };
    // Notify all listeners
    Object.keys(this.listeners).forEach(key => this.notifyListeners(key));
  }
}

// Export singleton instance
window.fileUploadState = window.fileUploadState || new FileUploadState();