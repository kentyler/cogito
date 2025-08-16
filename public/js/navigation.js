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
    // Available methods: getElementById exists on document
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
    } else if (tabName === 'upload-files') {
        // Initialize upload files component if it exists
        if (window.fileUpload && window.fileUpload.init) {
            window.fileUpload.init();
        }
    } else if (tabName === 'daily-summary') {
        // Initialize daily summary component if it exists
        console.log('Daily Summary tab selected');
        if (window.DailySummary && window.DailySummary.render) {
            console.log('Calling DailySummary.render()');
            window.DailySummary.render();
        } else {
            console.error('DailySummary not found or render method missing');
        }
    } else if (tabName === 'monthly-summary') {
        // Initialize monthly summary component if it exists
        console.log('Monthly Summary tab selected');
        if (window.MonthlySummary && window.MonthlySummary.render) {
            console.log('Calling MonthlySummary.render()');
            window.MonthlySummary.render();
        } else {
            console.error('MonthlySummary not found or render method missing');
        }
    } else if (tabName !== 'meetings') {
        console.log(`Switched to ${tabName} tab (stub)`);
    }
}