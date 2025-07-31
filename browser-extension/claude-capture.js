// Claude.ai conversation capture
class ClaudeCapture {
  constructor() {
    this.lastMessageCount = 0;
    this.sessionId = this.generateSessionId();
    this.captureEnabled = false;
    this.currentClient = null;
    this.init();
  }

  generateSessionId() {
    return 'claude_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    console.log('Cogito: Claude capture initialized');
    
    // Listen for messages from sidebar/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TOGGLE_CAPTURE') {
        this.captureEnabled = message.enabled;
        this.currentClient = message.client;
        console.log(`Cogito: Capture ${this.captureEnabled ? 'enabled' : 'disabled'}`);
      }
    });
    
    // Check initial state from storage
    chrome.storage.local.get(['captureEnabled', 'currentClient'], (data) => {
      this.captureEnabled = data.captureEnabled || false;
      this.currentClient = data.currentClient;
    });
    
    this.startMonitoring();
  }

  startMonitoring() {
    // Monitor for new messages
    const observer = new MutationObserver(() => {
      this.checkForNewMessages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check periodically
    setInterval(() => this.checkForNewMessages(), 2000);
  }

  checkForNewMessages() {
    try {
      // Only process if capture is enabled
      if (!this.captureEnabled || !this.currentClient) {
        return;
      }
      
      const messages = this.extractMessages();
      if (messages.length > this.lastMessageCount) {
        const newMessages = messages.slice(this.lastMessageCount);
        this.processNewMessages(newMessages);
        this.lastMessageCount = messages.length;
      }
    } catch (error) {
      console.error('Cogito: Error checking messages:', error);
    }
  }

  extractMessages() {
    // Claude.ai DOM selectors (these may need updating based on UI changes)
    const messageElements = document.querySelectorAll('[data-testid*="message"], .message, [class*="message"]');
    const messages = [];

    messageElements.forEach((element, index) => {
      const content = this.extractMessageContent(element);
      const isUser = this.isUserMessage(element);
      
      if (content && content.trim()) {
        messages.push({
          index,
          content: content.trim(),
          isUser,
          timestamp: new Date().toISOString(),
          element: element
        });
      }
    });

    return messages;
  }

  extractMessageContent(element) {
    // Try multiple strategies to extract text content
    const textElement = element.querySelector('div[class*="text"], p, .prose, [data-testid*="text"]') || element;
    return textElement.innerText || textElement.textContent || '';
  }

  isUserMessage(element) {
    // Determine if message is from user or Claude
    const classList = element.className || '';
    const dataAttrs = element.dataset || {};
    
    // Common patterns for user messages
    return classList.includes('user') || 
           classList.includes('human') ||
           dataAttrs.author === 'user' ||
           element.querySelector('[data-testid*="user"]') !== null;
  }

  processNewMessages(newMessages) {
    // Group messages into exchanges (user prompt + Claude response)
    for (let i = 0; i < newMessages.length - 1; i += 2) {
      const userMessage = newMessages[i];
      const claudeMessage = newMessages[i + 1];

      if (userMessage && claudeMessage && userMessage.isUser && !claudeMessage.isUser) {
        this.captureExchange({
          userPrompt: userMessage.content,
          claudeResponse: claudeMessage.content,
          timestamp: claudeMessage.timestamp
        });
      }
    }
  }

  captureExchange(exchange) {
    const conversationData = {
      platform: 'claude',
      sessionId: this.sessionId,
      url: window.location.href,
      userPrompt: exchange.userPrompt,
      claudeResponse: exchange.claudeResponse,
      timestamp: exchange.timestamp,
      metadata: {
        userAgent: navigator.userAgent,
        pageTitle: document.title
      }
    };

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'CAPTURE_CONVERSATION',
      data: conversationData
    });

    console.log('Cogito: Captured Claude exchange', {
      userPromptLength: exchange.userPrompt.length,
      responseLength: exchange.claudeResponse.length
    });
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ClaudeCapture());
} else {
  new ClaudeCapture();
}