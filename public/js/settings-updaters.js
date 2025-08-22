/**
 * Settings Update Functions - Handle client, avatar, LLM, and temperature updates
 * Available methods: updateClientSetting, updateAvatarSetting, updateLLMSetting, updateTemperatureSetting
 */

import { loadAvailableAvatars, loadCurrentTemperature } from './settings-data-loader.js';
import { updateSettingsForm } from './settings-form-updater.js';
import { updateTemperatureDisplay } from './temperature-settings.js';

export async function updateClientSetting(clientId, settingsState) {
    try {
        // Use existing client switching logic
        if (window.switchClient) {
            await window.switchClient(clientId);
            settingsState.currentClient = clientId;
            
            // Reload avatars for new client
            settingsState.availableAvatars = await loadAvailableAvatars(clientId);
            
            // Reload temperature setting for new client
            settingsState.currentTemperature = await loadCurrentTemperature(clientId);
            
            updateSettingsForm(settingsState, updateTemperatureDisplay);
        }
    } catch (error) {
        console.error('Error updating client:', error);
    }
}

export async function updateAvatarSetting(avatarId, settingsState) {
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
}

export async function updateLLMSetting(llmId, settingsState) {
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
}

export async function updateTemperatureSetting(temperature, settingsState) {
    // Update display immediately for responsiveness
    updateTemperatureDisplay(temperature);
    
    const { updateTemperature: updateTempSetting } = await import('./temperature-settings.js');
    const success = await updateTempSetting(
        temperature, 
        settingsState.currentClient,
        (newTemp) => {
            settingsState.currentTemperature = newTemp;
        },
        () => {
            // Revert display on error
            updateTemperatureDisplay(settingsState.currentTemperature);
        }
    );
}