/**
 * Golden Horde API Communication Module
 * Handles message sending and API interactions
 */

let isWaitingForResponse = false;

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    const message = messageInput.value.trim();
    if (!message || isWaitingForResponse) return;
    
    // Update UI state
    isWaitingForResponse = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';
    setStatus('Sending...');
    
    // Add user message to conversation
    addMessageToConversation('User', message);
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    updateCharacterCount();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // For now, simulate API call (replace with actual Cogito API)
        const response = await simulateAPICall(message);
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add assistant response
        addMessageToConversation('Assistant', response, true);
        
        setStatus('Ready');
        
    } catch (error) {
        hideTypingIndicator();
        addMessageToConversation('System', 'Sorry, there was an error processing your message. Please try again.');
        setStatus('Error - Ready');
        console.error('Chat error:', error);
    } finally {
        // Reset UI state
        isWaitingForResponse = false;
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
        messageInput.focus();
    }
}

async function simulateAPICall(message) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple responses for demo
    const responses = [
        "That's an interesting perspective on " + message.substring(0, 30) + "...",
        "Let me think about that. " + message + " raises some important points.",
        "The Golden Horde Collective finds your query intriguing. Here's our collective wisdom...",
        "From our distributed intelligence network: " + message + " connects to several important concepts.",
        "Analyzing through our swarm intelligence... Your input suggests we should explore this further."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function showTypingIndicator() {
    const conversation = document.getElementById('conversation');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message assistant-message p-4 rounded-lg max-w-4xl bg-gray-50 border-l-4 border-gray-400';
    typingDiv.innerHTML = `
        <div class="font-semibold text-sm mb-2">Golden Horde Collective</div>
        <div class="typing-animation">
            <span></span><span></span><span></span>
        </div>
    `;
    
    conversation.appendChild(typingDiv);
    conversation.scrollTop = conversation.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Make functions available globally
window.isWaitingForResponse = isWaitingForResponse;
window.sendMessage = sendMessage;
window.simulateAPICall = simulateAPICall;
window.showTypingIndicator = showTypingIndicator;
window.hideTypingIndicator = hideTypingIndicator;