// Background script for handling sidebar and capture functionality
class CogitoBackground {
  constructor() {
    this.localEndpoint = 'http://localhost:3000';
    this.hostedEndpoint = 'https://cogito-app.onrender.com';
    this.currentAuth = null;
    this.currentClient = null;
    this.init();
  }

  init() {
    // Listen for messages from content scripts and sidebar
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'CAPTURE_CONVERSATION':
          this.handleConversation(message.data, sender, sendResponse);
          return true;
        case 'CLIENT_CHANGED':
          this.handleClientChange(message.client);
          break;
        case 'TOGGLE_CAPTURE':
          this.handleCaptureToggle(message.enabled, sender);
          break;
        case 'OPEN_SIDEBAR':
          this.openSidebar();
          break;
      }
    });

    // Set up action click to open sidebar
    chrome.action.onClicked.addListener(() => {
      this.openSidebar();
    });

    console.log('Cogito: Background script initialized');
  }

  async openSidebar() {
    const tab = await this.getCurrentTab();
    if (tab) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  }

  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  handleClientChange(client) {
    this.currentClient = client;
    console.log('Cogito: Client changed to:', client.name);
  }

  async handleCaptureToggle(enabled, sender) {
    // Notify the appropriate content script
    if (sender.tab) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'CAPTURE_TOGGLE_RESPONSE',
        enabled: enabled
      });
    }
  }

  async handleConversation(conversationData, sender, sendResponse) {
    try {
      // Get current auth and client info
      const storage = await chrome.storage.local.get(['authToken', 'currentClient', 'baseUrl']);
      
      if (!storage.authToken || !storage.currentClient) {
        sendResponse({ success: false, error: 'Not authenticated or no client selected' });
        return;
      }

      // Add tab and client information
      conversationData.tabId = sender.tab?.id;
      conversationData.tabUrl = sender.tab?.url;
      conversationData.clientId = storage.currentClient.client_id;

      // Send to capture endpoint
      const endpoint = `${storage.baseUrl}/api/capture-browser-conversation`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storage.authToken}`,
          'X-Client-ID': storage.currentClient.client_id
        },
        body: JSON.stringify(conversationData)
      });
      
      if (response.ok) {
        console.log(`Cogito: Conversation captured successfully for client ${storage.currentClient.name}`);
        sendResponse({ success: true, client: storage.currentClient.name });
      } else {
        const errorText = await response.text();
        console.error('Cogito: API error:', response.status, errorText);
        sendResponse({ success: false, error: `API error: ${response.status}` });
      }
    } catch (error) {
      console.error('Cogito: Error handling conversation:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Handle extension installation
  handleInstall() {
    console.log('Cogito: Extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      captureEnabled: false, // Disabled by default for privacy
      baseUrl: this.localEndpoint
    });
  }
}

// Initialize background handler
const cogitoBackground = new CogitoBackground();

// Handle extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  cogitoBackground.handleInstall();
});