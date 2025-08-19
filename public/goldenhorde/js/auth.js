// Authentication check for chat interface

// Check authentication status on load
document.addEventListener('DOMContentLoaded', async function() {
    await checkChatAuth();
});

async function checkChatAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Chat authentication verified:', data.user.email);
            
            // Show user info if available
            updateUserInfo(data.user);
            
            // Initialize chat interface
            initializeChat();
        } else {
            // Redirect to main login page
            console.log('Chat authentication failed, redirecting to login');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Redirect to main login page on error
        window.location.href = '/';
    }
}

function updateUserInfo(user) {
    // Add user indicator to the interface
    const chatHeader = document.querySelector('#chatInterface .bg-white.border-b');
    if (chatHeader && !document.getElementById('chatUserInfo')) {
        const userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'chatUserInfo';
        userInfoDiv.className = 'text-xs text-gray-600 mt-1';
        userInfoDiv.textContent = `Logged in as: ${user.email}`;
        
        const headerContent = chatHeader.querySelector('.flex.items-center.justify-between');
        headerContent.appendChild(userInfoDiv);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            window.location.href = '/';
        }).catch(error => {
            console.error('Logout error:', error);
            window.location.href = '/';
        });
    }
}