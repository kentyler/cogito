// Background script for handling captured conversations
class ConversationHandler {
  constructor() {
    this.localEndpoint = 'http://localhost:3000/api/capture-browser-conversation';
    this.hostedEndpoint = 'https://cogito-app.onrender.com/api/capture-browser-conversation';
    this.healthEndpoint = null; // Will be set based on which service is used
    this.init();
  }

  init() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CAPTURE_CONVERSATION') {
        this.handleConversation(message.data, sender, sendResponse);
        return true; // Keep channel open for async response
      }
    });

    console.log('Cogito: Background script initialized');
  }

  async handleConversation(conversationData, sender, sendResponse) {
    try {
      // Add tab information
      conversationData.tabId = sender.tab?.id;
      conversationData.tabUrl = sender.tab?.url;

      // Determine which service to use and ensure it's available
      const serviceInfo = await this.determineService();
      if (!serviceInfo.available) {
        console.error('Cogito: No available service found');
        sendResponse({ success: false, error: 'Service unavailable' });
        return;
      }

      // Send to appropriate API
      const response = await this.sendToAPI(conversationData, serviceInfo.endpoint);
      
      if (response.ok) {
        console.log(`Cogito: Conversation captured successfully via ${serviceInfo.type}`);
        sendResponse({ success: true, service: serviceInfo.type });
      } else {
        console.error('Cogito: API error:', response.status, response.statusText);
        sendResponse({ success: false, error: 'API error' });
      }
    } catch (error) {
      console.error('Cogito: Error handling conversation:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async determineService() {
    // First, check if user is authenticated with hosted service
    const authStatus = await this.checkHostedAuth();
    if (authStatus.authenticated) {
      return {
        type: 'hosted',
        endpoint: this.hostedEndpoint,
        available: true,
        authenticated: true
      };
    }

    // Fall back to local server if available
    const localAvailable = await this.checkLocalServer();
    if (localAvailable) {
      return {
        type: 'local',
        endpoint: this.localEndpoint,
        available: true,
        authenticated: false
      };
    }

    // No service available
    return {
      type: 'none',
      endpoint: null,
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
      console.log('Cogito: Hosted service not available or not authenticated');
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

  async sendToAPI(conversationData, endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for hosted service authentication
        body: JSON.stringify(conversationData)
      });

      return response;
    } catch (error) {
      console.error('Cogito: Network error sending to API:', error);
      throw error;
    }
  }

  // Handle extension installation
  handleInstall() {
    console.log('Cogito: Extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      enabled: true,
      apiEndpoint: this.apiEndpoint,
      captureEnabled: {
        claude: true,
        openai: true
      }
    });
  }
}

// Initialize background handler
const conversationHandler = new ConversationHandler();

// Handle extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  conversationHandler.handleInstall();
});