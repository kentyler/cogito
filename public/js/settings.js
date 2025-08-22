// Settings dropdown functionality for client, avatar, and LLM selection
import { loadCurrentTemperature, updateTemperature, updateTemperatureDisplay } from './temperature-settings.js';
import { loadAvailableClients, loadAvailableAvatars, loadAvailableLLMs } from './settings-data-loader.js';
import { updateSettingsForm } from './settings-form-updater.js';

// Settings dropdown state
let settingsState = {
    currentClient: null,
    currentAvatar: null,
    currentLLM: 'claude-3-5-sonnet',
    currentTemperature: 0.7,
    availableClients: [],
    availableAvatars: [],
    availableLLMs: [
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' }
    ]
};

// Toggle settings dropdown visibility
window.toggleSettings = function() {
    const dropdown = document.getElementById('settingsDropdown');
    const isHidden = dropdown.classList.contains('hidden');
    
    if (isHidden) {
        // Show dropdown and populate data
        dropdown.classList.remove('hidden');
        populateSettingsForm();
        
        // Add click outside listener
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    } else {
        // Hide dropdown
        closeSettings();
    }
};

// Close settings dropdown
window.closeSettings = function() {
    const dropdown = document.getElementById('settingsDropdown');
    dropdown.classList.add('hidden');
    document.removeEventListener('click', handleClickOutside);
};

// Handle clicking outside the dropdown
function handleClickOutside(event) {
    const dropdown = document.getElementById('settingsDropdown');
    const button = document.getElementById('settingsButton');
    
    if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        closeSettings();
    }
}

// Populate the settings form with current data
async function populateSettingsForm() {
    try {
        // Get current user preferences from server
        const prefsResponse = await fetch('/api/user/preferences', {
            credentials: 'include'
        });
        
        if (prefsResponse.ok) {
            const prefsData = await prefsResponse.json();
            console.log('User preferences from server:', prefsData);
            if (prefsData.success && prefsData.preferences) {
                settingsState.currentClient = prefsData.preferences.client_id;
                settingsState.currentAvatar = prefsData.preferences.avatar_id;
                settingsState.currentLLM = prefsData.preferences.llm_id || 'claude-3-5-sonnet';
            }
        }
        
        // Also update from local storage as fallback
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('User from localStorage:', user);
        
        if (!settingsState.currentClient && user.client_id) {
            settingsState.currentClient = user.client_id;
        }
        if (!settingsState.currentAvatar && user.last_avatar_id) {
            settingsState.currentAvatar = user.last_avatar_id;
        }
        if (!settingsState.currentLLM && user.last_llm_id) {
            settingsState.currentLLM = user.last_llm_id;
        }
        
        // If still no values, try to get from current session display
        if (!settingsState.currentClient) {
            // Check if there's a client name displayed somewhere
            const clientDisplay = document.querySelector('[data-current-client]');
            if (clientDisplay) {
                settingsState.currentClient = clientDisplay.dataset.currentClient;
            }
        }
        
        console.log('Current settings state:', {
            client: settingsState.currentClient,
            avatar: settingsState.currentAvatar,
            llm: settingsState.currentLLM
        });
        
        // Load available clients
        await loadAvailableClients();
        
        // Load available avatars for current client
        if (settingsState.currentClient) {
            await loadAvailableAvatars(settingsState.currentClient);
        }
        
        // Load available LLMs from server
        await loadAvailableLLMs();
        
        // Update form fields
        updateSettingsForm();
        
    } catch (error) {
        console.error('Error populating settings form:', error);
    }
}

// Load available clients
async function loadAvailableClients() {
    try {
        const response = await fetch('/api/clients', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            settingsState.availableClients = data.clients || [];
            console.log('Loaded clients from API:', settingsState.availableClients);
        } else {
            console.error('Failed to load clients:', response.status);
            settingsState.availableClients = [];
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        settingsState.availableClients = [];
    }
}

// Load available avatars for a client
async function loadAvailableAvatars(clientId) {
    try {
        const response = await fetch(`/api/clients/${clientId}/avatars`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            settingsState.availableAvatars = data.avatars || [];
            
            // Only set default avatar if we don't have one already
            if (!settingsState.currentAvatar) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                settingsState.currentAvatar = user.last_avatar_id || (data.avatars[0] && data.avatars[0].id);
            }
        }
    } catch (error) {
        console.error('Error loading avatars:', error);
        settingsState.availableAvatars = [];
    }
}

// Load available LLMs from the server
async function loadAvailableLLMs() {
    try {
        const response = await fetch('/api/llms', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            settingsState.availableLLMs = data.llms || [];
            
            // Only set default LLM if we don't have one already
            if (!settingsState.currentLLM) {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                settingsState.currentLLM = user.last_llm_id || 'claude-3-5-sonnet';
            }
        }
    } catch (error) {
        console.error('Error loading LLMs:', error);
        // Fall back to static list
        settingsState.availableLLMs = [
            { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' }
        ];
    }
}

// Update the settings form fields
function updateSettingsForm() {
    // Update client dropdown
    const clientSelect = document.getElementById('settingsClient');
    if (clientSelect) {
        clientSelect.innerHTML = '';
        settingsState.availableClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.client_id || client.id;
            option.textContent = client.client_name || client.name;
            // Compare as numbers to handle type mismatches
            option.selected = (client.client_id || client.id) == settingsState.currentClient;
            clientSelect.appendChild(option);
        });
        // If current client wasn't found in the list, still select it if we have a value
        if (clientSelect.value != settingsState.currentClient && settingsState.currentClient) {
            clientSelect.value = settingsState.currentClient;
        }
    }
    
    // Update avatar dropdown
    const avatarSelect = document.getElementById('settingsAvatar');
    if (avatarSelect) {
        avatarSelect.innerHTML = '';
        settingsState.availableAvatars.forEach(avatar => {
            const option = document.createElement('option');
            option.value = avatar.id;
            option.textContent = avatar.name;
            // Compare as numbers to handle type mismatches
            option.selected = avatar.id == settingsState.currentAvatar;
            avatarSelect.appendChild(option);
            
            // Add description as title
            if (avatar.description) {
                option.title = avatar.description;
            }
        });
        // If current avatar wasn't found in the list, still select it if we have a value
        if (avatarSelect.value != settingsState.currentAvatar && settingsState.currentAvatar) {
            avatarSelect.value = settingsState.currentAvatar;
        }
    }
    
    // Update LLM dropdown
    const llmSelect = document.getElementById('settingsLLM');
    if (llmSelect) {
        llmSelect.innerHTML = '';
        settingsState.availableLLMs.forEach(llm => {
            const option = document.createElement('option');
            option.value = llm.id || llm.model_id || llm.model;
            option.textContent = llm.name;
            // Compare with various possible ID fields
            const llmId = llm.id || llm.model_id || llm.model;
            option.selected = llmId === settingsState.currentLLM;
            llmSelect.appendChild(option);
        });
        // If current LLM wasn't found in the list, still select it if we have a value
        if (llmSelect.value != settingsState.currentLLM && settingsState.currentLLM) {
            llmSelect.value = settingsState.currentLLM;
        }
    }
}

// Update client selection
window.updateClient = async function(clientId) {
    try {
        // Use existing client switching logic
        if (window.switchClient) {
            await window.switchClient(clientId);
            settingsState.currentClient = clientId;
            
            // Reload avatars for new client
            await loadAvailableAvatars(clientId);
            updateSettingsForm();
        }
    } catch (error) {
        console.error('Error updating client:', error);
    }
};

// Update avatar selection
window.updateAvatar = async function(avatarId) {
    try {
        const response = await fetch('/api/user/avatar-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ avatar_id: avatarId })
        });
        
        if (response.ok) {
            settingsState.currentAvatar = avatarId;
            
            // Update local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.last_avatar_id = avatarId;
            localStorage.setItem('user', JSON.stringify(user));
            
            console.log('✅ Avatar preference updated:', avatarId);
        } else {
            console.error('Failed to update avatar preference');
        }
    } catch (error) {
        console.error('Error updating avatar:', error);
    }
};

// Update LLM selection
window.updateLLM = async function(llmId) {
    try {
        const response = await fetch('/api/user/llm-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ llm_id: llmId })
        });
        
        if (response.ok) {
            settingsState.currentLLM = llmId;
            
            // Update local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.last_llm_id = llmId;
            localStorage.setItem('user', JSON.stringify(user));
            
            console.log('✅ LLM preference updated:', llmId);
        } else {
            console.error('Failed to update LLM preference');
        }
    } catch (error) {
        console.error('Error updating LLM:', error);
    }
};

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Settings will be populated when dropdown is opened
    console.log('Settings module loaded');
});