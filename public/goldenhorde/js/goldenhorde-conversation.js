/**
 * Golden Horde Conversation Management Module
 * Handles conversation display and management
 */

let conversationHistory = [];

function addMessageToConversation(sender, message, isMarkdown = false) {
    const conversation = document.getElementById('conversation');
    const messageDiv = document.createElement('div');
    
    // Clear welcome message if this is the first real message
    if (conversation.children.length === 1 && conversation.children[0].classList.contains('text-center')) {
        conversation.innerHTML = '';
    }
    
    messageDiv.className = `message ${sender.toLowerCase()}-message p-4 rounded-lg max-w-4xl ${
        sender === 'User' ? 'bg-blue-50 border-l-4 border-blue-400 ml-auto' : 'bg-gray-50 border-l-4 border-gray-400'
    }`;
    
    const senderSpan = document.createElement('div');
    senderSpan.className = 'font-semibold text-sm mb-2';
    senderSpan.textContent = sender === 'User' ? 'You' : 'Golden Horde Collective';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isMarkdown && sender === 'Assistant') {
        // Simple markdown rendering
        let processedContent = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br>');
        contentDiv.innerHTML = processedContent;
    } else {
        contentDiv.textContent = message;
    }
    
    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(contentDiv);
    conversation.appendChild(messageDiv);
    
    // Add to history
    conversationHistory.push({ sender, message, timestamp: new Date() });
    
    // Auto-scroll to bottom
    conversation.scrollTop = conversation.scrollHeight;
}

function clearConversation() {
    const conversation = document.getElementById('conversation');
    conversationHistory = [];
    
    // Reset to welcome message
    conversation.innerHTML = `
        <div class="text-center text-gray-500 py-8">
            <div class="text-6xl mb-4">🤖</div>
            <p class="text-lg mb-2">Welcome to Cogito Chat</p>
            <p class="text-sm">Select a prompt template from the left or type your own message below.</p>
        </div>
    `;
}

function setStatus(message) {
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
        statusIndicator.textContent = message;
    }
}

// Make functions and variables available globally
window.conversationHistory = conversationHistory;
window.addMessageToConversation = addMessageToConversation;
window.clearConversation = clearConversation;
window.setStatus = setStatus;