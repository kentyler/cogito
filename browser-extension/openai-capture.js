// ChatGPT conversation capture
class OpenAICapture {
  constructor() {
    this.lastMessageCount = 0;
    this.sessionId = this.generateSessionId();
    this.captureEnabled = false;
    this.currentClient = null;
    this.init();
  }

  generateSessionId() {
    return 'openai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    console.log('Cogito: OpenAI capture initialized');
    
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
    // ChatGPT DOM selectors (these may need updating based on UI changes)
    const messageElements = document.querySelectorAll('[data-message-author-role], .message, [data-testid*="conversation-turn"]');
    const messages = [];

    messageElements.forEach((element, index) => {
      const content = this.extractMessageContent(element);
      const role = this.getMessageRole(element);
      
      if (content && content.trim() && role) {
        messages.push({
          index,
          content: content.trim(),
          role,
          isUser: role === 'user',
          timestamp: new Date().toISOString(),
          element: element
        });
      }
    });

    return messages;
  }

  extractMessageContent(element) {
    // Try multiple strategies to extract text content
    const contentSelectors = [
      '.markdown',
      '[class*="markdown"]',
      '.prose',
      '[data-message-content]',
      'div[class*="text"]',
      'p',
      'div'
    ];

    for (const selector of contentSelectors) {
      const contentElement = element.querySelector(selector);
      if (contentElement) {
        const text = contentElement.innerText || contentElement.textContent;
        if (text && text.trim()) {
          return text.trim();
        }
      }
    }

    // Fallback to element itself
    return element.innerText || element.textContent || '';
  }

  getMessageRole(element) {
    // Get message role from data attributes or class names
    const role = element.getAttribute('data-message-author-role');
    if (role) return role;

    const classList = element.className || '';
    if (classList.includes('user')) return 'user';
    if (classList.includes('assistant') || classList.includes('gpt')) return 'assistant';

    // Check parent elements
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const parentRole = parent.getAttribute('data-message-author-role');
      if (parentRole) return parentRole;
      
      const parentClass = parent.className || '';
      if (parentClass.includes('user')) return 'user';
      if (parentClass.includes('assistant') || parentClass.includes('gpt')) return 'assistant';
      
      parent = parent.parentElement;
    }

    return null;
  }

  processNewMessages(newMessages) {
    // Group messages into exchanges (user prompt + GPT response)
    for (let i = 0; i < newMessages.length - 1; i += 2) {
      const userMessage = newMessages[i];
      const gptMessage = newMessages[i + 1];

      if (userMessage && gptMessage && 
          userMessage.role === 'user' && 
          gptMessage.role === 'assistant') {
        this.captureExchange({
          userPrompt: userMessage.content,
          gptResponse: gptMessage.content,
          timestamp: gptMessage.timestamp
        });
      }
    }
  }

  captureExchange(exchange) {
    const conversationData = {
      platform: 'openai',
      sessionId: this.sessionId,
      url: window.location.href,
      userPrompt: exchange.userPrompt,
      aiResponse: exchange.gptResponse,
      timestamp: exchange.timestamp,
      metadata: {
        userAgent: navigator.userAgent,
        pageTitle: document.title,
        model: this.detectModel()
      }
    };

    // Send to background script
    chrome.runtime.sendMessage({
      type: 'CAPTURE_CONVERSATION',
      data: conversationData
    });

    console.log('Cogito: Captured OpenAI exchange');
  }

  detectModel() {
    // Try to detect which GPT model is being used
    const pageText = document.body.textContent || '';
    if (pageText.includes('GPT-4')) return 'gpt-4';
    if (pageText.includes('GPT-3.5')) return 'gpt-3.5-turbo';
    return 'unknown';
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new OpenAICapture());
} else {
  new OpenAICapture();
}