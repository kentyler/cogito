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
        sendCommandToPage('Load my current personality configuration and show me the key traits that define our collaboration style.');
        window.close();
    });

    // Session reflection button
    document.getElementById('session-reflection').addEventListener('click', () => {
        sendCommandToPage('Let me reflect on our collaboration patterns in this session. What personality adjustments might improve our working relationship?');
        window.close();
    });

    // Evolution status button
    document.getElementById('evolution-status').addEventListener('click', () => {
        sendCommandToPage('Show me my current personality evolution status, including recent changes and pending proposals.');
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