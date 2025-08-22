// Settings dropdown functionality for client, avatar, and LLM selection
// Available methods: getElementById, getItem, setItem - verified DOM and localStorage APIs
import { loadCurrentTemperature, updateTemperatureDisplay } from './temperature-settings.js';
import { loadAvailableClients, loadAvailableAvatars, loadAvailableLLMs } from './settings-data-loader.js';
import { updateSettingsForm } from './settings-form-updater.js';
import { updateClientSetting, updateAvatarSetting, updateLLMSetting, updateTemperatureSetting } from './settings-updaters.js';

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
        
        // Load current temperature setting for client
        if (settingsState.currentClient) {
            settingsState.currentTemperature = await loadCurrentTemperature(settingsState.currentClient);
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
            llm: settingsState.currentLLM,
            temperature: settingsState.currentTemperature
        });
        
        // Load available clients
        settingsState.availableClients = await loadAvailableClients();
        
        // Load available avatars for current client
        if (settingsState.currentClient) {
            settingsState.availableAvatars = await loadAvailableAvatars(settingsState.currentClient);
        }
        
        // Load available LLMs from server
        settingsState.availableLLMs = await loadAvailableLLMs();
        
        // Update form fields
        updateSettingsForm(settingsState, updateTemperatureDisplay);
        
    } catch (error) {
        console.error('Error populating settings form:', error);
    }
}


// Global functions for HTML access (delegate to imported modules)
window.updateClient = async function(clientId) {
    await updateClientSetting(clientId, settingsState);
};

window.updateAvatar = async function(avatarId) {
    await updateAvatarSetting(avatarId, settingsState);
};

window.updateLLM = async function(llmId) {
    await updateLLMSetting(llmId, settingsState);
};

window.updateTemperature = async function(temperature) {
    await updateTemperatureSetting(temperature, settingsState);
};

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Settings will be populated when dropdown is opened
    console.log('Settings module loaded');
});