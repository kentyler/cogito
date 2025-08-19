/**
 * OAuth Authentication Module
 * Handles Google OAuth login functionality
 */

/**
 * Handle Google OAuth login
 */
window.loginWithGoogle = async function() {
    try {
        window.setLoginStatus('Redirecting to Google...', 'info');
        
        // Redirect to Google OAuth
        window.location.href = '/auth/oauth/google';
    } catch (error) {
        console.error('Google OAuth error:', error);
        window.setLoginStatus('Google login failed: ' + error.message, 'error');
    }
};

/**
 * Handle OAuth callback processing
 * This function is called when the user returns from OAuth provider
 */
window.handleOAuthCallback = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
        window.setLoginStatus('OAuth login failed: ' + decodeURIComponent(error), 'error');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    if (success === 'true') {
        window.setLoginStatus('OAuth login successful! Checking authentication...', 'success');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Check authentication status
        await window.checkAuth();
        return;
    }
};

// Initialize OAuth callback handling on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error') || urlParams.has('success')) {
        window.handleOAuthCallback();
    }
});