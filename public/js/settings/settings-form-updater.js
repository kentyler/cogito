// Settings form updating functionality

// Update the settings form fields
export function updateSettingsForm(settingsState, updateTemperatureDisplay) {
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
    
    // Update temperature slider
    updateTemperatureDisplay(settingsState.currentTemperature);
}