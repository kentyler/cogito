// Authentication functions - modular components in separate files
window.login = async function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        window.setLoginStatus('Please enter both email and password', 'error');
        return;
    }
    
    try {
        window.setLoginStatus('Logging in...', 'info');
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        
        const data = await response.json();
        console.log('✅ Login successful:', data);
        
        // Check if client selection is required
        if (data.requiresClientSelection && data.clients) {
            // Show client selection form
            window.showClientSelection(data.clients);
        } else {
            // Single client, use data.user directly
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Show main content
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            
            // Display user info with client name if available
            const clientName = data.user.client_name || data.user.client || '';
            if (clientName) {
                document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email} (${clientName})`;
            } else {
                document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email}`;
            }
            
            // Auto-load meetings after login
            setMeetingsStatus('Loading meetings...', 'info');
            window.loadMeetingsList();
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        window.setLoginStatus(error.message, 'error');
    }
}

// Logout functionality moved to logout-handler.js module

window.setLoginStatus = function(message, type = 'info') {
    const statusDiv = document.getElementById('loginStatus');
    const colors = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200'
    };
    statusDiv.innerHTML = `<div class="p-3 rounded border ${colors[type]}">${message}</div>`;
}

window.setClientSelectionStatus = function(message, type = 'info') {
    const statusDiv = document.getElementById('clientSelectionStatus');
    const colors = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200'
    };
    statusDiv.innerHTML = `<div class="p-3 rounded border ${colors[type]}">${message}</div>`;
}

window.showClientSelection = function(clients) {
    // Hide login form
    document.getElementById('loginForm').classList.add('hidden');
    
    // Show client selection form
    document.getElementById('clientSelectionForm').classList.remove('hidden');
    
    // Store available clients for later use in the dropdown
    localStorage.setItem('availableClients', JSON.stringify(clients));
    
    // Render hierarchical client selection using extracted module
    window.renderClientSelection(clients);
}

window.selectClient = async function(client) {
    try {
        window.setClientSelectionStatus('Selecting client...', 'info');
        
        const response = await fetch('/api/select-client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: client.client_id }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to select client');
        }
        
        const data = await response.json();
        console.log('✅ Client selected:', data);
        
        // Store user info
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Hide client selection form
        document.getElementById('clientSelectionForm').classList.add('hidden');
        
        // Show main content  
        document.getElementById('mainContent').classList.remove('hidden');
        
        // Update user info and setup client selector if multiple clients
        const userInfo = document.getElementById('userInfo');
        
        userInfo.textContent = `Logged in as: ${data.user.email}`;
        
        // Store clients info for selector
        window.availableClients = JSON.parse(localStorage.getItem('availableClients') || '[]');
        window.currentClient = client;
        
        // We removed the client selector from header, just show the client name
        if (client.client_name) {
            userInfo.textContent += ` (${client.client_name})`;
        }
        
        // Auto-load meetings after client selection
        setMeetingsStatus('Loading meetings...', 'info');
        window.loadMeetingsList();
        
    } catch (error) {
        console.error('❌ Client selection error:', error);
        window.setClientSelectionStatus(error.message, 'error');
    }
}

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
        document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email}`;
        
        // Reload meetings for new client
        window.setMeetingsStatus('Loading meetings for new client...', 'info');
        window.loadMeetingsList();
        
    } catch (error) {
        console.error('Client switch error:', error);
        // Restore previous selection
        document.getElementById('clientSelector').value = window.currentClient?.client_id;
        document.getElementById('userInfo').textContent = `Logged in as: ${JSON.parse(localStorage.getItem('user')).email}`;
        alert('Failed to switch client: ' + error.message);
    }
}

// Auth checking functionality moved to auth-checker.js module