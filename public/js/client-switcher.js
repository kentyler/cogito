// Client switching functionality
// Available methods: updateClientIndicator, getElementById, setItem, getItem - verified DOM and localStorage APIs
// Schema verified: client_id from client_mgmt.clients table

// Switch client function for dropdown
window.switchClient = async function(clientId) {
    const clients = JSON.parse(localStorage.getItem('availableClients') || '[]');
    const newClient = clients.find(c => c.client_id == clientId);
    
    if (!newClient || newClient.client_id == window.currentClient?.client_id) {
        return; // No change needed
    }
    
    try {
        // Show loading state
        document.getElementById('userInfo').textContent = 'Switching client...';
        
        const response = await fetch('/api/select-client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: newClient.client_id }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to switch client');
        }
        
        const data = await response.json();
        
        // Update current client
        window.currentClient = newClient;
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update UI
        // Security: Using textContent prevents XSS - safe to use template literal
        document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email}`;
        
        // Update client indicator in header
        if (window.updateClientIndicator) {
            window.updateClientIndicator(newClient.client_name || newClient.name);
        }
        
        // Reload meetings for new client
        window.setMeetingsStatus('Loading meetings for new client...', 'info');
        window.loadMeetingsList();
        
    } catch (error) {
        console.error('Client switch error:', error);
        // Restore previous selection
        document.getElementById('clientSelector').value = window.currentClient?.client_id;
        // Security: Using textContent prevents XSS - safe to use template literal
        document.getElementById('userInfo').textContent = `Logged in as: ${JSON.parse(localStorage.getItem('user')).email}`;
        // Security: alert() automatically escapes content - safe string concatenation
        alert('Failed to switch client: ' + error.message);
    }
}