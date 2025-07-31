// Main sidebar functionality for Cogito browser extension
class CogitoSidebar {
  constructor() {
    this.baseUrl = null;
    this.authToken = null;
    this.currentUser = null;
    this.currentClient = null;
    this.captureEnabled = false;
    this.isAISite = false;
    
    // Initialize managers
    this.authManager = new AuthManager(this);
    this.queryManager = new QueryManager(this);
    this.uiManager = new UIManager(this);
    
    this.init();
  }

  async init() {
    // Check if we're on an AI site
    const tab = await this.getCurrentTab();
    this.isAISite = this.checkIfAISite(tab?.url);
    
    // Load saved state
    await this.loadSavedState();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update UI based on auth state
    this.updateUIState();
    
    // Show/hide capture section based on site
    if (this.isAISite) {
      document.getElementById('capture-section').classList.remove('hidden');
    }
  }

  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  checkIfAISite(url) {
    if (!url) return false;
    return url.includes('claude.ai') || url.includes('chat.openai.com');
  }

  async loadSavedState() {
    const data = await chrome.storage.local.get([
      'authToken', 
      'currentUser', 
      'currentClient', 
      'baseUrl',
      'captureEnabled'
    ]);
    
    this.authToken = data.authToken;
    this.currentUser = data.currentUser;
    this.currentClient = data.currentClient;
    this.baseUrl = data.baseUrl || 'http://localhost:3000';
    this.captureEnabled = data.captureEnabled || false;
    
    // Update capture toggle
    if (this.authToken && this.isAISite) {
      document.getElementById('capture-toggle').checked = this.captureEnabled;
      this.updateCaptureStatus();
    }
  }

  setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.authManager.handleLogin();
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.authManager.handleLogout();
    });

    // Client selector
    document.getElementById('client-selector').addEventListener('change', (e) => {
      this.handleClientChange(e.target.value);
    });

    // Capture toggle
    document.getElementById('capture-toggle').addEventListener('change', (e) => {
      this.handleCaptureToggle(e.target.checked);
    });

    // Query form
    document.getElementById('query-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.queryManager.handleQuery();
    });

    // Clear response
    document.getElementById('clear-response').addEventListener('click', () => {
      this.queryManager.clearResponse();
    });
  }

  async handleClientChange(clientId) {
    if (!clientId) return;
    
    const selector = document.getElementById('client-selector');
    const selectedOption = selector.options[selector.selectedIndex];
    
    this.currentClient = {
      client_id: parseInt(clientId),
      name: selectedOption.textContent
    };
    
    await chrome.storage.local.set({ currentClient: this.currentClient });
    
    // Notify background script of client change
    chrome.runtime.sendMessage({
      type: 'CLIENT_CHANGED',
      client: this.currentClient
    });
  }

  async handleCaptureToggle(enabled) {
    this.captureEnabled = enabled;
    await chrome.storage.local.set({ captureEnabled: enabled });
    
    // Notify content scripts
    const tab = await this.getCurrentTab();
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_CAPTURE',
        enabled: enabled,
        client: this.currentClient
      });
    }
    
    this.updateCaptureStatus();
  }

  // Delegate methods to managers
  updateUIState() { this.uiManager.updateUIState(); }
  showLoading() { this.uiManager.showLoading(); }
  hideLoading() { this.uiManager.hideLoading(); }
  showError(elementId, message) { this.uiManager.showError(elementId, message); }
  updateCaptureStatus() { this.uiManager.updateCaptureStatus(); }
}

// Initialize sidebar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CogitoSidebar();
});