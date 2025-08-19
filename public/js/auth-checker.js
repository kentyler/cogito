/**
 * Auth Checker Module
 * Handles authentication status checking and user session validation
 */

/**
 * Check authentication status and setup UI accordingly
 */
window.checkAuth = async function() {
    try {
        const response = await fetch('/auth/check', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Auth check failed');
        }
        
        const data = await response.json();
        
        if (data.authenticated) {
            if (data.user && data.user.client_id) {
                // User is fully authenticated with client selected
                window.setupAuthenticatedUser(data.user);
            } else if (data.clients && data.clients.length > 0) {
                // User is authenticated but needs to select client
                window.showClientSelection(data.clients);
            } else {
                window.setLoginStatus('No accessible clients found', 'error');
            }
        } else {
            // User is not authenticated, show login form
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('clientSelectionForm').classList.add('hidden');
            document.getElementById('mainContent').classList.add('hidden');
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.setLoginStatus('Authentication check failed', 'error');
        
        // Show login form on error
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('clientSelectionForm').classList.add('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }
};

/**
 * Setup UI for authenticated user with client selected
 * @param {Object} user - User object with client information
 */
window.setupAuthenticatedUser = function(user) {
    // Hide login and client selection forms
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('clientSelectionForm').classList.add('hidden');
    
    // Show main content
    document.getElementById('mainContent').classList.remove('hidden');
    
    // Update user info display
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = `${user.email} (${user.client_name})`;
    }
    
    // Store user info for other modules
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('User authenticated:', user.email, 'Client:', user.client_name);
};