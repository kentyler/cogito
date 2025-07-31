// Authentication management for Cogito sidebar
class AuthManager {
  constructor(sidebar) {
    this.sidebar = sidebar;
  }

  async handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    this.sidebar.showLoading();
    
    try {
      // Try local first, then hosted
      const endpoints = [
        'http://localhost:3000',
        'https://cogito-app.onrender.com'
      ];
      
      let loginResponse = null;
      let workingEndpoint = null;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${endpoint}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          if (response.ok) {
            loginResponse = await response.json();
            workingEndpoint = endpoint;
            break;
          }
        } catch (err) {
          continue;
        }
      }
      
      if (!loginResponse) {
        throw new Error('Invalid credentials or server unavailable');
      }
      
      this.sidebar.baseUrl = workingEndpoint;
      this.sidebar.authToken = loginResponse.token;
      this.sidebar.currentUser = loginResponse.user;
      
      // Save to storage
      await chrome.storage.local.set({
        authToken: this.sidebar.authToken,
        currentUser: this.sidebar.currentUser,
        baseUrl: this.sidebar.baseUrl
      });
      
      // Get user's clients
      await this.loadUserClients();
      
    } catch (error) {
      this.sidebar.showError('auth-error', error.message);
    } finally {
      this.sidebar.hideLoading();
    }
  }

  async loadUserClients() {
    try {
      const response = await fetch(`${this.sidebar.baseUrl}/api/user/clients`, {
        headers: {
          'Authorization': `Bearer ${this.sidebar.authToken}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load clients');
      
      const clients = await response.json();
      
      if (clients.length === 1) {
        // Auto-select single client
        this.sidebar.currentClient = clients[0];
        await chrome.storage.local.set({ currentClient: this.sidebar.currentClient });
        this.sidebar.updateUIState();
      } else if (clients.length > 1) {
        // Show client selector
        this.populateClientSelector(clients);
        document.getElementById('client-selector-wrapper').classList.remove('hidden');
        this.sidebar.updateUIState();
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      this.sidebar.showError('auth-error', 'Failed to load clients');
    }
  }

  populateClientSelector(clients) {
    const selector = document.getElementById('client-selector');
    selector.innerHTML = '<option value="">Select Client...</option>';
    
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.client_id;
      option.textContent = client.name;
      selector.appendChild(option);
    });
    
    // Select current client if set
    if (this.sidebar.currentClient) {
      selector.value = this.sidebar.currentClient.client_id;
    }
  }

  async handleLogout() {
    await chrome.storage.local.clear();
    this.sidebar.authToken = null;
    this.sidebar.currentUser = null;
    this.sidebar.currentClient = null;
    this.sidebar.captureEnabled = false;
    
    // Reset UI
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('capture-toggle').checked = false;
    
    this.sidebar.updateUIState();
  }
}