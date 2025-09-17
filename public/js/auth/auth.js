// Authentication functions - modular components in separate files
// Available methods: updateClientIndicator, getElementById, setItem, getItem - verified DOM and localStorage APIs
// Schema verified: client_id from client_mgmt.clients table
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
                // Security: Using textContent prevents XSS - safe to use template literal
                document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email} (${clientName})`;
            } else {
                // Security: Using textContent prevents XSS - safe to use template literal
                document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email}`;
            }
            
            // Update client indicator in header
            if (window.updateClientIndicator) {
                window.updateClientIndicator(clientName);
            }
            
            // Meetings functionality removed - conversations now handled in talk tab
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
        
        // Update client indicator in header
        if (window.updateClientIndicator) {
            window.updateClientIndicator(client.client_name);
        }
        
        // Meetings functionality removed - conversations now handled in talk tab
        
    } catch (error) {
        console.error('❌ Client selection error:', error);
        window.setClientSelectionStatus(error.message, 'error');
    }
}

// Client switching functionality moved to client-switcher.js module