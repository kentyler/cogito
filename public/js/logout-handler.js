/**
 * Logout Handler Module  
 * Handles user logout and session cleanup
 */

/**
 * Handle user logout
 */
window.logout = async function() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Clear any locally stored data
            localStorage.removeItem('availableClients');
            
            // Reset UI to login state
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('clientSelectionForm').classList.add('hidden');
            document.getElementById('mainContent').classList.add('hidden');
            
            // Clear form fields
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            
            window.setLoginStatus('Logged out successfully', 'success');
        } else {
            window.setLoginStatus('Logout failed', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.setLoginStatus('Logout error: ' + error.message, 'error');
    }
};

/**
 * Initialize logout functionality on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add any logout-specific initialization here
    console.log('Logout handler initialized');
});