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

// Handle file drops on prompt area
window.handleFileDrop = async function(files) {
    const meetingId = document.getElementById('meetingId').value;
    
    if (!meetingId) {
        alert('Please select a meeting first');
        return;
    }
    
    if (!files || files.length === 0) return;
    
    // Show uploading message in conversation
    if (typeof window.appendTurn === 'function') {
        window.appendTurn({
            speaker: 'System',
            content: `📎 Uploading ${files.length} file(s)...`
        });
    }
    
    try {
        // Use existing file upload API (when server is working)
        const formData = new FormData();
        for (const file of files) {
            formData.append('files', file);
        }
        
        // For now, just show what would happen
        console.log('🔍 Would upload files:', Array.from(files).map(f => f.name));
        
        // Simulate file processing
        for (const file of files) {
            let responseMessage = '';
            
            if (file.name.endsWith('.cogito')) {
                // For .cogito files, simulate analysis
                responseMessage = `🧠 Analyzing thinking tool: ${file.name}\n\n`;
                responseMessage += 'Analysis would appear here when server is working...';
            } else {
                // For regular files, show upload confirmation
                responseMessage = `✅ Would upload: ${file.name} (${formatFileSize(file.size)})\n`;
                responseMessage += 'File processing would happen when server is working...';
            }
            
            // Add response to conversation
            if (typeof window.appendTurn === 'function') {
                window.appendTurn({
                    speaker: 'Assistant',
                    content: responseMessage
                });
            }
        }
        
    } catch (error) {
        console.error('❌ File drop error:', error);
        if (typeof window.appendTurn === 'function') {
            window.appendTurn({
                speaker: 'System',
                content: `❌ File drop failed: ${error.message}`
            });
        }
    }
}

// Format file size helper
window.formatFileSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Add Enter key support for prompt submission
window.initializeConversation = function() {
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        // Enter key handler
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitPrompt();
            }
        });
        
        // Add drag-drop handlers for file drops
        promptInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            promptInput.classList.add('border-blue-400', 'bg-blue-50');
        });
        
        promptInput.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            promptInput.classList.remove('border-blue-400', 'bg-blue-50');
        });
        
        promptInput.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            promptInput.classList.remove('border-blue-400', 'bg-blue-50');
            
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                await handleFileDrop(files);
            }
        });
    }
}