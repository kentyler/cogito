// Bot Creation Form Module - Handles the create bot form

(function() {
    'use strict';

    // Create and render the bot creation form
    function render(container, state, callbacks) {
        const formHtml = `
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-2xl font-bold mb-6">Create Recall Bot</h2>
                
                <div id="botCreationMessage" class="hidden mb-4 p-4 rounded"></div>
                
                <form id="botCreationForm" class="space-y-4">
                    <div class="form-group">
                        <label for="meetingUrl" class="block text-sm font-medium text-gray-700 mb-1">
                            Meeting URL
                        </label>
                        <input type="text" id="meetingUrl" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Enter the meeting URL"
                               required>
                    </div>
                    
                    <div class="form-group">
                        <label for="meetingName" class="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Name (optional)
                        </label>
                        <input type="text" id="meetingName"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Enter a name for this meeting">
                    </div>
                    
                    <div id="userEmailInfo" class="hidden p-3 bg-blue-50 rounded-md">
                        <p class="text-sm text-gray-700">
                            Transcript will be sent to: <span id="userEmailDisplay" class="font-medium"></span>
                        </p>
                    </div>
                    
                    <button type="submit" id="createBotButton"
                            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        Create Bot
                    </button>
                </form>
            </div>
        `;

        container.innerHTML = formHtml;

        // Set up form elements
        const elements = {
            form: document.getElementById('botCreationForm'),
            meetingUrl: document.getElementById('meetingUrl'),
            meetingName: document.getElementById('meetingName'),
            createButton: document.getElementById('createBotButton'),
            message: document.getElementById('botCreationMessage'),
            userEmailInfo: document.getElementById('userEmailInfo'),
            userEmailDisplay: document.getElementById('userEmailDisplay')
        };

        // Display user email if available
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            elements.userEmailInfo.classList.remove('hidden');
            elements.userEmailDisplay.textContent = userEmail;
        }

        // Set up event listener
        elements.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const meetingUrl = elements.meetingUrl.value.trim();
            const meetingName = elements.meetingName.value.trim();
            
            if (!meetingUrl) {
                showMessage(elements.message, 'Please enter a meeting URL', 'error');
                return;
            }
            
            // Call the provided callback
            if (callbacks.onSubmit) {
                await callbacks.onSubmit(meetingUrl, meetingName);
            }
        });

        return elements;
    }

    // Show a message in the form
    function showMessage(messageElement, text, type) {
        messageElement.textContent = text;
        messageElement.className = `mb-4 p-4 rounded ${
            type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`;
        messageElement.classList.remove('hidden');

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => hideMessage(messageElement), 5000);
        }
    }

    // Hide the message
    function hideMessage(messageElement) {
        messageElement.classList.add('hidden');
    }

    // Set loading state
    function setLoading(elements, loading) {
        elements.createButton.disabled = loading;
        elements.createButton.textContent = loading ? 'Creating Bot...' : 'Create Bot';
        elements.meetingUrl.disabled = loading;
        elements.meetingName.disabled = loading;
    }

    // Clear the form
    function clearForm(elements) {
        elements.form.reset();
    }

    // Public API
    window.botCreationForm = {
        render,
        showMessage,
        hideMessage,
        setLoading,
        clearForm
    };
})();