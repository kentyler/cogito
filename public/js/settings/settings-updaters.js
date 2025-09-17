/**
 * Settings Update Functions - Handle client, LLM, and temperature updates
 * Available methods: updateClientIndicator, getElementById, setItem, getItem - verified DOM and localStorage APIs
 */
import { updateSettingsForm } from './settings-form-updater.js';
import { loadCurrentTemperature, updateTemperatureDisplay } from './temperature-settings.js';

export async function updateClientSetting(clientId, settingsState) {
    try {
        // Use existing client switching logic
        if (window.switchClient) {
            await window.switchClient(clientId);
            settingsState.currentClient = clientId;
            
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

export async function updateLLMSetting(llmId, settingsState) {
    try {
        const response = await fetch('/settings/user/llm-preference', {
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