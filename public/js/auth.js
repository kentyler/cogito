// Authentication functions for simple transcript viewer

// Make functions globally accessible
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

window.logout = async function() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Logout failed');
        }
        
        // Clear user info
        localStorage.removeItem('user');
        
        // Show login form
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
        
        // Clear any loaded content
        document.getElementById('meetings-list').innerHTML = '';
        document.getElementById('content').innerHTML = '';
        document.getElementById('meetingId').value = '';
        
        window.setLoginStatus('Logged out successfully', 'success');
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
}

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
    
    // Populate clients list
    const clientsList = document.getElementById('clientsList');
    clientsList.innerHTML = '';
    
    clients.forEach(client => {
        const button = document.createElement('button');
        button.className = 'w-full p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors';
        button.innerHTML = `
            <div class="font-medium">${client.client_name}</div>
            <div class="text-sm text-gray-500">Role: ${client.role}</div>
        `;
        button.onclick = () => window.selectClient(client);
        clientsList.appendChild(button);
    });
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

// Check if already logged in on page load
window.checkAuth = async function() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            
            // Validate session with server
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                // Session is valid, show main content
                document.getElementById('loginForm').classList.add('hidden');
                document.getElementById('mainContent').classList.remove('hidden');
                
                // Setup user info - we removed client selector from header
                const availableClients = JSON.parse(localStorage.getItem('availableClients') || '[]');
                
                // Find current client from user data
                const currentClientId = user.client_id || user.current_client_id;
                
                // Find and set current client
                let currentClientName = '';
                if (availableClients.length > 0) {
                    availableClients.forEach(c => {
                        if (c.client_id == currentClientId) {
                            window.currentClient = c;
                            currentClientName = c.client_name;
                        }
                    });
                    
                    // If no match found, use first client
                    if (!currentClientName && availableClients[0]) {
                        window.currentClient = availableClients[0];
                        currentClientName = availableClients[0].client_name;
                    }
                } else {
                    // Use info from user object if no clients list
                    currentClientName = user.client_name || user.client || '';
                }
                
                // Show user info with client name
                document.getElementById('userInfo').textContent = `Logged in as: ${user.email}${currentClientName ? ` (${currentClientName})` : ''}`;
                
                // Auto-load meetings if logged in
                setTimeout(() => window.loadMeetingsList(), 500);
            } else {
                // Session invalid, clear localStorage and show login
                console.log('Session invalid, clearing localStorage');
                localStorage.removeItem('user');
                document.getElementById('loginForm').classList.remove('hidden');
                document.getElementById('mainContent').classList.add('hidden');
            }
        } catch (e) {
            console.error('Error checking auth:', e);
            localStorage.removeItem('user');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('mainContent').classList.add('hidden');
        }
    } else {
        // No stored user, ensure login form is visible
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }
}