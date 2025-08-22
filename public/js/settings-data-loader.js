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

// Load available avatars for a client
export async function loadAvailableAvatars(clientId) {
    try {
        const response = await fetch(`/api/clients/${clientId}/avatars`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.avatars || [];
        }
    } catch (error) {
        console.error('Error loading avatars:', error);
        return [];
    }
}

// Load available LLMs from the server
export async function loadAvailableLLMs() {
    try {
        const response = await fetch('/api/llms', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.llms || [];
        }
    } catch (error) {
        console.error('Error loading LLMs:', error);
        // Fall back to static list
        return [
            { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' }
        ];
    }
}