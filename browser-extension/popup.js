// Popup script for extension controls
class PopupController {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateStatus();
  }

  async loadSettings() {
    this.settings = await chrome.storage.local.get({
      enabled: true,
      captureEnabled: {
        claude: true,
        openai: true
      }
    });
  }

  setupEventListeners() {
    const toggle = document.getElementById('capture-toggle');
    toggle.addEventListener('click', () => this.toggleCapture());
    
    // Update toggle visual state
    this.updateToggle();
  }

  updateToggle() {
    const toggle = document.getElementById('capture-toggle');
    if (this.settings.enabled) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }

  async toggleCapture() {
    this.settings.enabled = !this.settings.enabled;
    await chrome.storage.local.set({ enabled: this.settings.enabled });
    this.updateToggle();
    this.updateStatus();
  }

  async updateStatus() {
    // Check service status
    const serviceInfo = await this.checkServiceStatus();
    
    // Check which tabs are active with our content scripts
    const [claudeTab] = await chrome.tabs.query({ url: 'https://claude.ai/*' });
    const [openaiTab] = await chrome.tabs.query({ url: 'https://chat.openai.com/*' });

    const claudeIndicator = document.getElementById('claude-indicator');
    const openaiIndicator = document.getElementById('openai-indicator');

    // Update Claude status
    if (claudeTab && this.settings.enabled && serviceInfo.available) {
      claudeIndicator.classList.add('active');
      claudeIndicator.classList.remove('inactive');
    } else {
      claudeIndicator.classList.remove('active');
      claudeIndicator.classList.add('inactive');
    }

    // Update OpenAI status
    if (openaiTab && this.settings.enabled && serviceInfo.available) {
      openaiIndicator.classList.add('active');
      openaiIndicator.classList.remove('inactive');
    } else {
      openaiIndicator.classList.remove('active');
      openaiIndicator.classList.add('inactive');
    }

    // Update footer with service status
    this.updateServiceStatus(serviceInfo);
  }

  async checkServiceStatus() {
    // Check hosted service first
    const hostedAuth = await this.checkHostedAuth();
    if (hostedAuth.authenticated) {
      return {
        type: 'hosted',
        available: true,
        authenticated: true
      };
    }

    // Check local service
    const localAvailable = await this.checkLocalServer();
    if (localAvailable) {
      return {
        type: 'local',
        available: true,
        authenticated: false
      };
    }

    return {
      type: 'none',
      available: false,
      authenticated: false
    };
  }

  async checkHostedAuth() {
    try {
      const response = await fetch('https://cogito-app.onrender.com/api/auth-status', {
        method: 'GET',
        credentials: 'include',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        return { authenticated: data.authenticated || false };
      }
    } catch (error) {
      console.log('Hosted service check failed');
    }
    
    return { authenticated: false };
  }

  async checkLocalServer() {
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        timeout: 2000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  updateServiceStatus(serviceInfo) {
    const footer = document.querySelector('.footer');
    
    if (serviceInfo.type === 'hosted') {
      footer.innerHTML = `
        ✅ Connected to Cogito Cloud<br>
        Conversations synced to your<br>
        Cogito account
      `;
    } else if (serviceInfo.type === 'local') {
      footer.innerHTML = `
        ✅ Connected to local Cogito<br>
        Conversations stored locally<br>
        for search and analysis
      `;
    } else {
      footer.innerHTML = `
        ⚠️ No Cogito service found<br>
        <a href="https://cogito-app.onrender.com" target="_blank">Sign in to Cogito</a> or<br>
        start local server
      `;
    }
  }
}

// Initialize popup when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});