// Navigation and tab functions

// Tab navigation functions
window.showTab = function(tabName) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active styling from all tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('border-blue-500', 'text-blue-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab content
    const contentId = tabName + '-content';
    const content = document.getElementById(contentId);
    if (content) {
        content.classList.remove('hidden');
    }
    
    // Add active styling to selected tab
    const tabButton = event?.target;
    if (tabButton) {
        tabButton.classList.remove('border-transparent', 'text-gray-500');
        tabButton.classList.add('border-blue-500', 'text-blue-600');
    }
    
    // Initialize tab-specific components
    if (tabName === 'bot-creation') {
        // Initialize bot creation component if it exists
        if (window.botCreation && window.botCreation.init) {
            window.botCreation.init();
        }
    } else if (tabName !== 'meetings') {
        console.log(`Switched to ${tabName} tab (stub)`);
    }
}