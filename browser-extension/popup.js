/**
 * Cogito Browser Extension - Popup Interface
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize popup interface
    updateSessionStats();
    bindEventHandlers();
    loadPersonalityInfo();
});

function updateSessionStats() {
    // Update interaction count from storage
    chrome.storage.local.get(['interactionCount'], (result) => {
        const count = result.interactionCount || 0;
        document.getElementById('interaction-count').textContent = `${count} interactions`;
    });
}

function bindEventHandlers() {
    // Load personality profile button
    document.getElementById('load-personality').addEventListener('click', () => {
        sendCommandToPage('Please use the load_personality MCP tool to load my current personality configuration for this collaboration session.');
        window.close();
    });

    // Session reflection button
    document.getElementById('session-reflection').addEventListener('click', () => {
        sendCommandToPage('Please use the reflect_on_session MCP tool to analyze our current collaboration and suggest personality evolutions.');
        window.close();
    });

    // Evolution status button
    document.getElementById('evolution-status').addEventListener('click', () => {
        sendCommandToPage('Please use the personality_status MCP tool to show my current personality configuration and evolution history.');
        window.close();
    });
}

function loadPersonalityInfo() {
    // Load personality information from storage or defaults
    chrome.storage.local.get(['personalityVersion', 'collaboratorName'], (result) => {
        if (result.personalityVersion) {
            document.getElementById('personality-version').textContent = result.personalityVersion;
        }
        if (result.collaboratorName) {
            document.getElementById('collaborator-name').textContent = result.collaboratorName;
        }
    });
}

function sendCommandToPage(prompt) {
    // Send command to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('claude.ai')) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'insertPrompt',
                prompt: prompt
            });
        }
    });
}

// Update stats periodically
setInterval(updateSessionStats, 5000);