/**
 * Settings Update Functions - Handle client, LLM, and temperature updates (avatar system removed)
 * Available methods: updateClientSetting, updateLLMSetting, updateTemperatureSetting (avatar functions removed)
 * Available methods: updateClientIndicator, getElementById, setItem, getItem - verified DOM and localStorage APIs
 */

// Available methods: updateClientIndicator, getElementById, setItem, getItem - verified DOM and localStorage APIs
// Schema verified: llm_id from llms table (avatar schema removed)
// Avatar imports removed - avatar system eliminated
import { updateSettingsForm } from './settings-form-updater.js';
import { loadCurrentTemperature, updateTemperatureDisplay } from './temperature-settings.js';

export async function updateClientSetting(clientId, settingsState) {
    try {
        // Use existing client switching logic
        if (window.switchClient) {
            await window.switchClient(clientId);
            settingsState.currentClient = clientId;
            
            // Avatar reloading removed - avatar system eliminated
            
            // Reload temperature setting for new client
            settingsState.currentTemperature = await loadCurrentTemperature(clientId);
            
            updateSettingsForm(settingsState, updateTemperatureDisplay);
            
            // Update client indicator - get the client name from the dropdown
            const select = document.getElementById('settingsClient');
            if (select && window.updateClientIndicator) {
                const selectedOption = select.options[select.selectedIndex];
                if (selectedOption) {
                    window.updateClientIndicator(selectedOption.text);
                }
            }
        }
    } catch (error) {
        console.error('Error updating client:', error);
    }
}

// DEPRECATED: Avatar update function removed - avatar system eliminated
export async function updateAvatarSetting(avatarId, settingsState) {
    console.log('Avatar system has been deprecated - no action taken');
    // Function kept for compatibility but does nothing
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
    const success = await updateTempSetting({
        temperature,
        clientId: settingsState.currentClient,
        onSuccess: (newTemp) => {
            settingsState.currentTemperature = newTemp;
        },
        onError: () => {
            // Revert display on error
            updateTemperatureDisplay(settingsState.currentTemperature);
        }
    });
}