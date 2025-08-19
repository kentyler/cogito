// Golden Horde Authentication
// Simple email/password authentication for public access

// Email/password login
window.login = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        setLoginStatus('Please enter both email and password', 'error');
        return;
    }
    
    try {
        setLoginStatus('Joining the collective...', 'info');
        
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email, 
                password,
                goldenhorde: true // Mark this as Golden Horde login
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Authentication failed');
        }
        
        const data = await response.json();
        console.log('✅ Golden Horde login successful:', data);
        
        // Redirect to main interface
        window.location.href = '/';
        
    } catch (error) {
        console.error('❌ Golden Horde login error:', error);
        setLoginStatus(error.message, 'error');
    }
}

// Status message display
function setLoginStatus(message, type) {
    const statusDiv = document.getElementById('loginStatus');
    statusDiv.className = `mb-4 p-3 rounded ${getStatusClasses(type)}`;
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }
}

function getStatusClasses(type) {
    switch (type) {
        case 'success':
            return 'bg-green-900 border border-green-600 text-green-200';
        case 'error':
            return 'bg-red-900 border border-red-600 text-red-200';
        case 'info':
            return 'bg-blue-900 border border-blue-600 text-blue-200';
        default:
            return 'bg-gray-700 border border-gray-600 text-gray-200';
    }
}

// Check if already authenticated on page load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/auth/status', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                // Already logged in, redirect to main interface
                window.location.href = '/';
            }
        }
    } catch (error) {
        // Not authenticated, stay on login page
        console.log('Not authenticated, showing login form');
    }
});