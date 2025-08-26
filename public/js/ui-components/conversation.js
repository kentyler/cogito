// Conversation and prompt handling functions

// Submit prompt function
window.submitPrompt = async function() {
    const promptInput = document.getElementById('prompt-input');
    const submitBtn = document.getElementById('submit-btn');
    const prompt = promptInput.value.trim();
    const meetingId = document.getElementById('meetingId').value;
    
    if (!prompt) return;
    if (!meetingId) {
        alert('Please select a meeting first');
        return;
    }
    
    // Disable form while processing
    promptInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    
    try {
        // Add user's prompt to display immediately
        console.log('🔍 Adding user prompt to display:', prompt);
        if (typeof window.appendTurn === 'function') {
            window.appendTurn({
                speaker: 'User',
                content: prompt
            });
        } else {
            console.error('❌ appendTurn function not found when adding user prompt');
        }
        
        // Send to API
        console.log('🔍 About to send API request with:', { content: prompt, meeting_id: meetingId });
        console.log('🔍 Request will include cookies:', document.cookie ? 'YES' : 'NO');
        const response = await fetch('/api/conversational-turn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: prompt,
                meeting_id: meetingId
            }),
            credentials: 'include'
        });
        
        console.log('🔍 API response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📥 Response:', data);
        console.log('🔍 About to call appendTurn with response:', data.response);
        
        // Add LLM response to display
        if (typeof window.appendTurn === 'function') {
            console.log('✅ appendTurn function exists');
            window.appendTurn({
                speaker: 'Assistant',
                content: data.response
            });
        } else {
            console.error('❌ appendTurn function not found on window object');
            alert('Error: appendTurn function not available');
        }
        
        // Clear input
        promptInput.value = '';
        
    } catch (error) {
        console.error('❌ Error submitting prompt:', error);
        alert('Error: ' + error.message);
        
        // Remove the user's prompt if there was an error
        const contentDiv = document.getElementById('content');
        const lastChild = contentDiv.lastElementChild;
        if (lastChild) {
            lastChild.remove();
        }
    } finally {
        // Re-enable form
        promptInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send';
        promptInput.focus();
    }
}

// Add Enter key support for prompt submission
window.initializeConversation = function() {
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitPrompt();
            }
        });
    }
}