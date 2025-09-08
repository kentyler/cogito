// Settings data loading functionality

// Load available clients
export async function loadAvailableClients() {
    try {
        const response = await fetch('/api/clients', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const clients = data.clients || [];
            console.log('Loaded clients from API:', clients);
            return clients;
        } else {
            console.error('Failed to load clients:', response.status);
            return [];
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        return [];
    }
}

// DEPRECATED: Avatar loading removed - avatar system eliminated
// This function is kept for compatibility but returns empty array
export async function loadAvailableAvatars(clientId) {
    console.log('Avatar system has been deprecated - returning empty array');
    return [];
}

// Load available LLMs from the server
export async function loadAvailableLLMs() {
    try {
        const response = await fetch('/settings/llms', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Loaded LLMs from server:', data.llms);
            return data.llms || [];
        } else {
            console.error('Failed to load LLMs, status:', response.status);
            // Fall back to static list
            return [
                { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' }
            ];
        }
    } catch (error) {
        console.error('Error loading LLMs:', error);
        // Fall back to static list
        return [
            { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' }
        ];
    }
}