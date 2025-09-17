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
    
    // Update LLM dropdown
    const llmSelect = document.getElementById('settingsLLM');
    if (llmSelect) {
        console.log('🔧 Populating LLM dropdown with:', settingsState.availableLLMs);
        console.log('🎯 Current LLM to select:', settingsState.currentLLM, typeof settingsState.currentLLM);
        
        llmSelect.innerHTML = '';
        settingsState.availableLLMs.forEach(llm => {
            const option = document.createElement('option');
            option.value = llm.id || llm.model_id || llm.model;
            option.textContent = llm.name;
            // Compare with various possible ID fields
            const llmId = llm.id || llm.model_id || llm.model;
            option.selected = String(llmId) === String(settingsState.currentLLM);
            console.log(`  📋 Adding option: ${option.value} (${typeof option.value}) = ${option.textContent} ${option.selected ? '✅ SELECTED' : ''}`);
            llmSelect.appendChild(option);
        });
        // If current LLM wasn't found in the list, still select it if we have a value
        if (llmSelect.value != settingsState.currentLLM && settingsState.currentLLM) {
            console.log('⚠️ Current LLM not found in options, setting directly:', settingsState.currentLLM);
            llmSelect.value = settingsState.currentLLM;
        }
        console.log('✅ Final LLM dropdown value:', llmSelect.value);
    }
    
    // Update temperature slider
    updateTemperatureDisplay(settingsState.currentTemperature);
}