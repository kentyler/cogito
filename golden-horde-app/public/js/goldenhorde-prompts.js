/**
 * Golden Horde Prompt Templates Module
 * Handles prompt template selection and usage
 */

function usePrompt(promptText) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = promptText;
    messageInput.focus();
    
    // Move cursor to the end
    messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
    
    // Trigger input event to update character count and auto-resize
    messageInput.dispatchEvent(new Event('input'));
}

function usePromptAndSend(promptText, buttonElement) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = promptText;
    
    // Add visual feedback
    if (buttonElement) {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Sending...';
        buttonElement.disabled = true;
        
        // Reset after sending
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }, 1000);
    }
    
    // Send the message
    sendMessage();
}

function filterPrompts() {
    const searchTerm = document.getElementById('promptSearch').value.toLowerCase();
    const promptButtons = document.querySelectorAll('.prompt-item');
    
    promptButtons.forEach(button => {
        const text = button.textContent.toLowerCase();
        const category = button.closest('.prompt-category');
        
        if (text.includes(searchTerm)) {
            button.style.display = 'block';
            if (category) category.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
    
    // Hide empty categories
    const categories = document.querySelectorAll('.prompt-category');
    categories.forEach(category => {
        const visibleButtons = category.querySelectorAll('.prompt-item[style*="block"]');
        if (visibleButtons.length === 0 && searchTerm) {
            category.style.display = 'none';
        } else if (!searchTerm) {
            category.style.display = 'block';
        }
    });
}

function toggleCategory(categoryId) {
    const prompts = document.getElementById(categoryId + '-prompts');
    const chevron = document.querySelector(`[onclick*="${categoryId}"] .category-chevron`);
    
    if (prompts.style.display === 'none') {
        prompts.style.display = 'block';
        chevron.textContent = '▼';
    } else {
        prompts.style.display = 'none';
        chevron.textContent = '▶';
    }
}

// Make functions available globally
window.usePrompt = usePrompt;
window.usePromptAndSend = usePromptAndSend;
window.filterPrompts = filterPrompts;
window.toggleCategory = toggleCategory;