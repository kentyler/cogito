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
            document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email}`;
            
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
        document.getElementById('userInfo').textContent = `Logged in as: ${data.user.email} (${client.client_name})`;
        
        // Auto-load meetings after client selection
        setMeetingsStatus('Loading meetings...', 'info');
        window.loadMeetingsList();
        
    } catch (error) {
        console.error('❌ Client selection error:', error);
        window.setClientSelectionStatus(error.message, 'error');
    }
}

// Check if already logged in on page load
window.checkAuth = function() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            document.getElementById('userInfo').textContent = `Logged in as: ${user.email}`;
            // Auto-load meetings if logged in
            setTimeout(() => window.loadMeetingsList(), 500);
        } catch (e) {
            console.error('Invalid user data in localStorage');
            localStorage.removeItem('user');
        }
    }
}