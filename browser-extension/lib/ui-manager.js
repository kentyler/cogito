// UI state management for Cogito sidebar
class UIManager {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  updateUIState() {
    const authSection = document.getElementById('auth-section');
    const mainInterface = document.getElementById('main-interface');
    
    if (this.sidebar.authToken && this.sidebar.currentClient) {
      // Show main interface
      authSection.classList.add('hidden');
      mainInterface.classList.remove('hidden');
      
      // Update user info
      document.getElementById('user-email').textContent = this.sidebar.currentUser?.email || '';
      
    } else if (this.sidebar.authToken && !this.sidebar.currentClient) {
      // Waiting for client selection
      authSection.classList.add('hidden');
      mainInterface.classList.remove('hidden');
      document.getElementById('user-email').textContent = this.sidebar.currentUser?.email || '';
      
    } else {
      // Show auth
      authSection.classList.remove('hidden');
      mainInterface.classList.add('hidden');
    }
  }

  showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
  }

  showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      setTimeout(() => {
        errorEl.classList.add('hidden');
      }, 5000);
    }
  }

  updateCaptureStatus() {
    const statusEl = document.getElementById('capture-status');
    if (this.sidebar.captureEnabled) {
      statusEl.textContent = `Capturing to ${this.sidebar.currentClient?.name || 'Cogito'}`;
      statusEl.style.color = '#059669';
    } else {
      statusEl.textContent = 'Capture disabled';
      statusEl.style.color = '#6b7280';
    }
  }
}