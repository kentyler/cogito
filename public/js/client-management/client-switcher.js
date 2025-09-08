// Client switching functionality
// Available methods: updateClientIndicator, getElementById, setItem, getItem - verified DOM and localStorage APIs
// Schema verified: client_id from client_mgmt.clients table

// Switch client function for dropdown
window.switchClient = async function(clientId) {
    console.log('switchClient called with:', clientId);
    const clients = JSON.parse(localStorage.getItem('availableClients') || '[]');
    console.log('Available clients:', clients);
    
    // Find by client_id field (the actual field from the database)
    const newClient = clients.find(c => c.client_id == clientId);
    
    console.log('Current client:', window.currentClient);
    console.log('New client:', newClient);
    
    if (!newClient) {
        console.error('Client not found in available clients:', clientId);
        return;
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
        
        // Update UI - just show email since client is shown in header
        // Security: Using textContent prevents XSS - safe to use template literal
        document.getElementById('userInfo').textContent = data.user.email;
        
        // Update client indicator in header
        if (window.updateClientIndicator) {
            window.updateClientIndicator(newClient.client_name);
        }
        
        // Reload meetings for new client
        console.log('About to reload meetings list');
        if (window.setMeetingsStatus) {
            window.setMeetingsStatus('Loading meetings for new client...', 'info');
        }
        if (window.loadMeetingsList) {
            console.log('Calling loadMeetingsList');
            window.loadMeetingsList();
        } else {
            console.error('loadMeetingsList function not found');
        }
        
    } catch (error) {
        console.error('Client switch error:', error);
        // Restore previous selection
        document.getElementById('clientSelector').value = window.currentClient?.client_id;
        // Security: Using textContent prevents XSS - safe to use template literal
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('userInfo').textContent = user.email || 'User';
        // Security: alert() automatically escapes content - safe string concatenation
        alert('Failed to switch client: ' + error.message);
    }
}