const { ipcRenderer } = require('electron');

let messages, input, sendBtn, clientSelector, clientDropdown, uploadBtn;
let currentUser = null;
let availableClients = [];
let isLoggedIn = false;
let authState = 'email'; // 'email', 'password', 'client_selection', 'authenticated'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    messages = document.getElementById('messages');
    input = document.getElementById('input');
    sendBtn = document.getElementById('send');
    clientSelector = document.getElementById('client-selector');
    clientDropdown = document.getElementById('client-dropdown');
    uploadBtn = document.getElementById('upload');
    
    // Initialize after DOM is ready
    initialize();
});

// Add message to chat
function addMessage(content, type = 'assistant') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (typeof content === 'object') {
        messageDiv.innerHTML = `<div class="code">${JSON.stringify(content, null, 2)}</div>`;
    } else if (content.includes('```')) {
        // Handle code blocks
        messageDiv.innerHTML = content.replace(/```([\s\S]*?)```/g, '<div class="code">$1</div>');
    } else {
        messageDiv.textContent = content;
    }
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

// Update status
function updateStatus(text) {
    document.querySelector('.status').textContent = text;
}

// Populate client dropdown
function populateClientDropdown(clients, currentClientId) {
    availableClients = clients;
    clientDropdown.innerHTML = '<option value="">Select Client...</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.client_id;
        option.textContent = client.client_name;
        if (client.client_id === currentClientId) {
            option.selected = true;
        }
        clientDropdown.appendChild(option);
    });
    
    // Show the selector if there are multiple clients
    if (clients.length > 1) {
        clientSelector.style.display = 'flex';
    } else {
        clientSelector.style.display = 'none';
    }
}

// Handle client switching
function switchClient(newClientId) {
    if (!newClientId) return;
    
    const selectedClient = availableClients.find(c => c.client_id == newClientId);
    if (!selectedClient) return;
    
    // Clear messages and show switching status
    messages.innerHTML = '';
    updateStatus('Switching client...');
    
    // Send client switching command
    ipcRenderer.send('execute-powershell', `SWITCH_CLIENT:${newClientId}`);
}

// Handle file upload using native dialog
async function uploadFile() {
    if (!isLoggedIn || !currentUser) {
        addMessage('Please log in to upload files.', 'error');
        return;
    }

    updateStatus('Opening file dialog...');
    uploadBtn.disabled = true;

    try {
        // Use native file dialog
        const fileResult = await ipcRenderer.invoke('show-file-dialog');
        
        if (!fileResult.success) {
            if (!fileResult.canceled) {
                addMessage(`❌ Error reading file: ${fileResult.error}`, 'error');
            }
            return;
        }

        // Show uploading message
        addMessage(`📁 Uploading ${fileResult.fileName}...`, 'system');
        updateStatus('Uploading file...');

        // Convert base64 back to blob for upload
        const fileContent = atob(fileResult.fileContent);
        const fileBytes = new Uint8Array(fileContent.length);
        for (let i = 0; i < fileContent.length; i++) {
            fileBytes[i] = fileContent.charCodeAt(i);
        }
        const fileBlob = new Blob([fileBytes], { type: fileResult.mimeType });

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', fileBlob, fileResult.fileName);
        formData.append('clientId', currentUser.client_id.toString());
        formData.append('description', `Uploaded from Cogito UI by ${currentUser.display_name}`);
        
        // For now, let's create a simple file record via the database
        // Since the Supabase edge function has JWT authentication issues
        
        // Store file metadata in database via our existing db connection
        const fileUploadCommand = `UPLOAD_FILE:${JSON.stringify({
            filename: fileResult.fileName,
            fileSize: fileResult.fileSize,
            mimeType: fileResult.mimeType,
            clientId: currentUser.client_id,
            description: `Uploaded from Cogito UI by ${currentUser.display_name}`,
            content: fileResult.fileContent // base64 content
        })}`;
        
        // Send to db handler
        ipcRenderer.send('execute-powershell', fileUploadCommand);
        
        // We'll handle the response in the powershell-output handler
        addMessage('📁 File uploaded successfully. Processing and storing...', 'system');
        updateStatus(`${currentUser.display_name} @ ${currentUser.client_name}`);
    } catch (error) {
        console.error('Upload error:', error);
        addMessage(`❌ Upload error: ${error.message}`, 'error');
        updateStatus('Upload failed');
    } finally {
        uploadBtn.disabled = false;
    }
}

// Send message
function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    // Hide password in chat display
    const displayMessage = authState === 'password' ? '•'.repeat(message.length) : message;
    addMessage(displayMessage, 'user');
    input.value = '';
    sendBtn.disabled = true;
    updateStatus('Processing...');

    // Check authentication state
    if (!isLoggedIn) {
        if (authState === 'email') {
            // Send email check command
            console.log('Sending email check:', message);
            ipcRenderer.send('execute-powershell', `CHECK_EMAIL:${message}`);
        } else if (authState === 'password') {
            // Send password verification command
            console.log('Sending password verification');
            ipcRenderer.send('execute-powershell', `VERIFY_PASSWORD:${message}`);
        }
        return;
    }

    // Normal flow: Send to Claude with user context
    // Clear previous messages and show only the current prompt
    messages.innerHTML = '';
    addMessage(displayMessage, 'user');
    addMessage('Processing with Claude...', 'system');
    const contextPrompt = `
You are Cogito, an AI system that can access conversation history and patterns through semantic search of embedded content in the database.

User Context:
- User ID: ${currentUser.id}
- Email: ${currentUser.email}
- Display Name: ${currentUser.display_name}
- Client ID: ${currentUser.client_id}
- Client Name: ${currentUser.client_name}

Data Scope:
- You have access to conversations across ALL users in client "${currentUser.client_name}"
- This includes interactions from multiple team members, not just this user
- Use semantic search to find relevant patterns, insights, and conversations

Available Data Sources:
- conversation.turns table with embedded content for semantic search across client
- conversation.blocks for conversation organization
- conversation.analytical_insights for patterns and insights
- Files, events, and other structured data

User Request: ${message}

Interpret this request and provide a helpful response. You can search across all client team members' conversations using semantic similarity. Focus on embedding-based searches and pattern analysis that spans the entire client organization.`;
    
    ipcRenderer.send('execute-claude', contextPrompt);
}

// Initialize function
function initialize() {
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });

    // Client dropdown change handler
    clientDropdown.addEventListener('change', (e) => {
        switchClient(e.target.value);
    });

    // Upload button handler
    uploadBtn.addEventListener('click', () => {
        uploadFile();
    });

    // IPC listeners
    ipcRenderer.on('claude-response', (event, response) => {
        // Remove the "Processing with Claude..." message
        const systemMessages = messages.querySelectorAll('.message.system');
        systemMessages.forEach(msg => {
            if (msg.textContent.includes('Processing with Claude')) {
                msg.remove();
            }
        });
        
        addMessage(response, 'assistant');
        sendBtn.disabled = false;
        updateStatus('Ready');
    });

    ipcRenderer.on('claude-error', (event, error) => {
        // Remove the "Processing with Claude..." message
        const systemMessages = messages.querySelectorAll('.message.system');
        systemMessages.forEach(msg => {
            if (msg.textContent.includes('Processing with Claude')) {
                msg.remove();
            }
        });
        
        addMessage(`Error: ${error}`, 'error');
        sendBtn.disabled = false;
        updateStatus('Error');
    });

    ipcRenderer.on('powershell-output', (event, output) => {
        console.log('Received powershell output:', output);
        if (output.trim()) {
            // Handle debug messages
            if (output.startsWith('DEBUG:')) {
                console.log(output);
                return;
            }
            
            // Check if this is auth response
            if (!isLoggedIn) {
                try {
                    const result = JSON.parse(output);
                    
                    if (authState === 'email') {
                        if (result.found) {
                            authState = 'password';
                            input.placeholder = 'Please enter your password...';
                            input.type = 'password';
                            updateStatus(`Password required for ${result.display_name}`);
                        } else {
                            addMessage('Email not found in our system.', 'error');
                            addMessage(`To request access, please visit: ${result.requestLink}`, 'system');
                            input.placeholder = 'Please enter your email...';
                        }
                    } else if (authState === 'password') {
                        if (result.authenticated) {
                            if (result.needs_client_selection) {
                                // Store user and client choices
                                currentUser = result.user;
                                availableClients = result.client_choices;
                                authState = 'client_selection';
                                input.style.display = 'none'; // Hide input during selection
                                
                                addMessage(`Welcome back, ${result.user.display_name}!`, 'system');
                                addMessage('Please select a client:', 'system');
                                
                                // Create clickable client list
                                result.client_choices.forEach(client => {
                                    const clientDiv = document.createElement('div');
                                    clientDiv.className = 'message system';
                                    clientDiv.style.cursor = 'pointer';
                                    clientDiv.style.backgroundColor = '#1a3d1a';
                                    clientDiv.style.border = '1px solid #2d5a2d';
                                    clientDiv.textContent = `📋 ${client.client_name}`;
                                    
                                    clientDiv.addEventListener('click', () => {
                                        // Clear all messages when client is selected
                                        messages.innerHTML = '';
                                        ipcRenderer.send('execute-powershell', `SELECT_CLIENT:${client.client_id}`);
                                        input.style.display = 'block'; // Show input again
                                    });
                                    
                                    messages.appendChild(clientDiv);
                                });
                                messages.scrollTop = messages.scrollHeight;
                            } else {
                                // Single client, proceed normally
                                currentUser = result.user;
                                isLoggedIn = true;
                                authState = 'authenticated';
                                input.type = 'text';
                                input.placeholder = 'Type your message...';
                                
                                // Hide client selector for single client users
                                clientSelector.style.display = 'none';
                                
                                addMessage(`Welcome back, ${result.user.display_name}!`, 'system');
                                
                                // Display client story
                                if (result.client_story && result.client_story.trim()) {
                                    addMessage('📖 Client Story:', 'system');
                                    addMessage(result.client_story, 'assistant');
                                } else {
                                    addMessage('📖 This client story will be updated as activities and events occur.', 'system');
                                }
                                
                                updateStatus(`${result.user.display_name} @ ${result.user.client_name}`);
                                addMessage('You can now ask about conversations, patterns, or insights across your team.', 'system');
                                
                                // Enable upload button
                                uploadBtn.disabled = false;
                            }
                        } else {
                            addMessage('Invalid password. Please try again:', 'error');
                            input.type = 'password';
                            input.placeholder = 'Please enter your password...';
                        }
                    } else if (authState === 'client_selection') {
                        if (result.client_selected) {
                            // Client selection complete
                            currentUser = result.user;
                            isLoggedIn = true;
                            authState = 'authenticated';
                            input.type = 'text';
                            input.placeholder = 'Type your message...';
                            input.style.display = 'block';
                            
                            // Populate client dropdown if user has multiple clients
                            if (availableClients.length > 0) {
                                populateClientDropdown(availableClients, result.user.client_id);
                            }
                            
                            // Display client story
                            if (result.client_story && result.client_story.trim()) {
                                addMessage('📖 Client Story:', 'system');
                                addMessage(result.client_story, 'assistant');
                            } else {
                                addMessage('📖 This client story will be updated as activities and events occur.', 'system');
                            }
                            
                            updateStatus(`${result.user.display_name} @ ${result.user.client_name}`);
                            addMessage('You can now ask about conversations, patterns, or insights across your team.', 'system');
                            
                            // Enable upload button
                            uploadBtn.disabled = false;
                        }
                    }
                } catch (e) {
                    // Not JSON, just show the output
                    addMessage(output, 'assistant');
                }
            } else {
                // Handle client switching responses for logged-in users
                try {
                    const result = JSON.parse(output);
                    
                    if (result.client_selected && isLoggedIn) {
                        // Client switching complete
                        currentUser = result.user;
                        
                        // Update client dropdown selection
                        if (availableClients.length > 0) {
                            populateClientDropdown(availableClients, result.user.client_id);
                        }
                        
                        // Display client story
                        if (result.client_story && result.client_story.trim()) {
                            addMessage('📖 Client Story:', 'system');
                            addMessage(result.client_story, 'assistant');
                        } else {
                            addMessage('📖 This client story will be updated as activities and events occur.', 'system');
                        }
                        
                        updateStatus(`${result.user.display_name} @ ${result.user.client_name}`);
                        addMessage('You can now ask about conversations, patterns, or insights across your team.', 'system');
                    } else if (result.file_uploaded) {
                        // File upload complete
                        const fileData = result.file;
                        addMessage(`✅ Successfully uploaded: ${fileData.filename}`, 'system');
                        addMessage(`File ID: ${fileData.id} | Size: ${Math.round(fileData.file_size / 1024)} KB`, 'system');
                        if (result.chunks_created === 'yes') {
                            addMessage('File content has been chunked and stored for search.', 'system');
                        }
                        addMessage('File is ready for use in conversations.', 'system');
                    } else {
                        // Not a recognized response, display as assistant message
                        addMessage(output, 'assistant');
                    }
                } catch (e) {
                    // Not JSON, just show the output
                    addMessage(output, 'assistant');
                }
            }
        }
        sendBtn.disabled = false;
        updateStatus(isLoggedIn ? `Logged in as ${currentUser.display_name}` : 'Ready - Please log in');
    });

    ipcRenderer.on('powershell-error', (event, error) => {
        // Filter out DEBUG messages from stderr
        if (!error.startsWith('DEBUG:')) {
            addMessage(`PowerShell Error: ${error}`, 'error');
            updateStatus('Error');
        }
        sendBtn.disabled = false;
    });

    // Initial status
    updateStatus('Ready - Please log in');
    input.placeholder = 'Please enter your email...';
    uploadBtn.disabled = true; // Disable upload until logged in
}