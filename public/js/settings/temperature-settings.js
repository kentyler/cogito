// Temperature settings management for client configuration

// Load current temperature setting for client
export async function loadCurrentTemperature(clientId) {
    try {
        const response = await fetch(`/settings/clients/${clientId}/settings/temperature`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.setting && data.setting.parsed_value !== undefined) {
                console.log('✅ Loaded client temperature:', data.setting.parsed_value);
                return data.setting.parsed_value;
            } else {
                // Use default if no setting found
                console.log('📊 Using default temperature: 0.7');
                return 0.7;
            }
        } else {
            console.error('Failed to load temperature setting:', response.status);
            return 0.7;
        }
    } catch (error) {
        console.error('Error loading temperature:', error);
        return 0.7;
    }
}

/**
 * Update temperature setting
 * @param {Object} options
 * @param {number} options.temperature - Temperature value (0-1)
 * @param {string} options.clientId - Client identifier
 * @param {Function} [options.onSuccess] - Success callback function
 * @param {Function} [options.onError] - Error callback function
 * @returns {Promise<boolean>} True if temperature was updated successfully
 */
export async function updateTemperature({ temperature, clientId, onSuccess, onError }) {
    try {
        // Validate temperature range
        const tempValue = parseFloat(temperature);
        if (tempValue < 0 || tempValue > 1) {
            console.error('Temperature must be between 0 and 1');
            return false;
        }
        
        // Save to server if we have a client
        if (clientId) {
            const response = await fetch(`/settings/clients/${clientId}/settings/temperature`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    temperature: tempValue 
                })
            });
            
            if (response.ok) {
                console.log('✅ Temperature updated:', tempValue);
                if (onSuccess) onSuccess(tempValue);
                return true;
            } else {
                console.error('Failed to update temperature setting');
                if (onError) onError();
                return false;
            }
        } else {
            console.warn('No client selected, temperature change not saved');
            return false;
        }
    } catch (error) {
        console.error('Error updating temperature:', error);
        if (onError) onError();
        return false;
    }
}

// Update temperature slider display
export function updateTemperatureDisplay(temperature) {
    const temperatureSlider = document.getElementById('settingsTemperature');
    const temperatureValue = document.getElementById('temperatureValue');
    
    if (temperatureSlider) {
        temperatureSlider.value = temperature;
    }
    if (temperatureValue) {
        temperatureValue.textContent = parseFloat(temperature).toFixed(2);
    }
}