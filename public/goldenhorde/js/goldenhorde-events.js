/**
 * Golden Horde Event Handlers Module
 * Handles UI interactions and input events
 */

function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    
    // Character counter
    messageInput.addEventListener('input', updateCharacterCount);
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

function updateCharacterCount() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    const length = messageInput.value.length;
    charCount.textContent = `${length} characters`;
    
    // Update color based on length
    if (length > 4000) {
        charCount.style.color = '#dc2626'; // red-600
    } else if (length > 3000) {
        charCount.style.color = '#d97706'; // amber-600
    } else {
        charCount.style.color = '#6b7280'; // gray-500
    }
}

function handleKeyDown(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

// Make functions available globally
window.setupEventListeners = setupEventListeners;
window.updateCharacterCount = updateCharacterCount;
window.handleKeyDown = handleKeyDown;