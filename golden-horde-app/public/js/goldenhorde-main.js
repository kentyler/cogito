/**
 * Golden Horde Main Module
 * Entry point that coordinates all modules
 */

// Initialize the chat interface
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupEventListeners();
});

function initializeChat() {
    // Focus on input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
        
        // Initialize character counter
        updateCharacterCount();
    }
    
    console.log('Golden Horde chat interface initialized');
}

// Export for global access
window.initializeChat = initializeChat;