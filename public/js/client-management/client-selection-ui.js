/**
 * Client Selection UI Module
 * Handles hierarchical client display and selection interface
 */

/**
 * Render hierarchical client selection interface
 * @param {Array} clients - Array of client objects with hierarchy info
 */
window.renderClientSelection = function(clients) {
    const clientsList = document.getElementById('clientsList');
    clientsList.innerHTML = '';
    
    clients.forEach(client => {
        const button = document.createElement('button');
        
        // Apply different styling for parent clients vs mini-hordes
        const isMinihorde = client.client_type === 'mini-horde';
        const baseClasses = 'w-full p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors';
        const indentClasses = isMinihorde ? 'ml-6 border-l-4 border-l-blue-300' : '';
        
        button.className = `${baseClasses} ${indentClasses}`;
        
        // Build the button content with hierarchy indication
        let buttonContent = `<div class="font-medium">`;
        if (isMinihorde) {
            buttonContent += `<span class="text-blue-600 mr-2">└─</span>`;
        }
        buttonContent += `${client.client_name}</div>`;
        buttonContent += `<div class="text-sm text-gray-500">Role: ${client.role}`;
        
        if (isMinihorde && client.parent_client_name) {
            buttonContent += ` • Mini-horde of ${client.parent_client_name}`;
        }
        buttonContent += `</div>`;
        
        button.innerHTML = buttonContent;
        button.onclick = () => window.selectClient(client);
        clientsList.appendChild(button);
    });
};

/**
 * Show client selection form with hierarchical display
 * @param {Array} clients - Array of client objects
 */
window.showClientSelection = function(clients) {
    console.log('Showing client selection for', clients.length, 'clients');
    
    // Hide login form
    document.getElementById('loginForm').style.display = 'none';
    
    // Show client selection form
    document.getElementById('clientSelectionForm').style.display = 'block';
    
    // Render the hierarchical client list
    window.renderClientSelection(clients);
};

/**
 * Set client selection status message
 * @param {string} message - Status message to display
 * @param {string} type - Message type ('info', 'error', 'success')
 */
window.setClientSelectionStatus = function(message, type = 'info') {
    const statusDiv = document.getElementById('clientSelectionStatus');
    const colorClasses = {
        info: 'text-blue-600',
        error: 'text-red-600', 
        success: 'text-green-600'
    };
    
    statusDiv.innerHTML = `<div class="${colorClasses[type] || colorClasses.info}">${message}</div>`;
    
    // Clear status after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
};