/**
 * Talk Tab - Selective Cogito Addressing
 * Implements @ parsing and selective LLM responses
 */

// Talk state
let talkClientId = null;
let talkTurns = [];
let talkPagination = {
    total: 0,
    loaded: 0,
    hasMore: true,
    loading: false
};

// Initialize Talk functionality
function initializeTalk() {
    console.log('Initializing Talk tab...');
    
    // Add input event listener for real-time addressing hints
    const talkInput = document.getElementById('talk-input');
    if (talkInput) {
        talkInput.addEventListener('input', updateAddressingHint);
    }
    
    // Add scroll event listener for pagination
    const turnsArea = document.getElementById('talk-turns');
    if (turnsArea) {
        turnsArea.addEventListener('scroll', handleTalkScroll);
    }
}

// Handle scroll events for pagination
function handleTalkScroll() {
    const turnsArea = document.getElementById('talk-turns');
    if (!turnsArea || talkPagination.loading || !talkPagination.hasMore) {
        return;
    }
    
    // Check if user scrolled near the top (within 50px)
    if (turnsArea.scrollTop < 50) {
        console.log('📜 User scrolled to top, loading older messages...');
        refreshTalkTurns(true); // loadOlder = true
    }
}

// Parse addressing in content (client-side preview)
function parseAddressingClient(content) {
    // Remove email addresses to avoid false matches
    const contentWithoutEmails = content.replace(/\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '');
    
    // Check for solitary @ (Cogito addressing) 
    const hasCogitoAddress = /(?:^|\s)@(?!\w)/.test(contentWithoutEmails);
    
    // Find @username mentions (user addressing) - for future use
    const userMentionPattern = /(?:^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[^\w@.])/g;
    const userMentions = [...contentWithoutEmails.matchAll(userMentionPattern)]
        .map(match => match[1])
        .filter(username => username.length > 0);
    
    return {
        shouldInvokeCogito: hasCogitoAddress,
        userMentions: userMentions,
        isComment: !hasCogitoAddress && userMentions.length === 0
    };
}

// Update addressing hint in real-time
function updateAddressingHint() {
    const input = document.getElementById('talk-input');
    const hint = document.getElementById('talk-addressing-hint');
    
    if (!input || !hint) return;
    
    const content = input.value;
    if (!content.trim()) {
        hint.textContent = '';
        return;
    }
    
    const addressing = parseAddressingClient(content);
    
    if (addressing.shouldInvokeCogito) {
        hint.textContent = '🤖 Cogito will respond';
        hint.className = 'text-blue-600 text-xs';
    } else if (addressing.userMentions.length > 0) {
        hint.textContent = `👋 Will mention: ${addressing.userMentions.join(', ')}`;
        hint.className = 'text-green-600 text-xs';
    } else {
        hint.textContent = '💬 Comment only (no response)';
        hint.className = 'text-gray-500 text-xs';
    }
}

// Handle Enter key press in talk input
function handleTalkKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendTalkMessage();
    }
}

// Send talk message
async function sendTalkMessage() {
    const input = document.getElementById('talk-input');
    if (!input) return;
    
    const content = input.value.trim();
    if (!content) return;
    
    // Clear input and hint
    input.value = '';
    updateAddressingHint();
    
    // Get current client ID from session/localStorage
    ensureTalkClient();
    
    // Parse addressing to determine if we need to show loading
    const addressing = parseAddressingClient(content);
    if (addressing.shouldInvokeCogito) {
        showTalkLoadingMessage();
    }
    
    try {
        // Send turn with addressing using simple talk endpoint
        const response = await fetch('/api/talk/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: talkClientId,
                content: content
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Remove loading indicator
            removeTalkLoadingMessage();
            
            // Add the user's turn to display immediately
            console.log('📝 Adding user turn to display:', result.turn);
            addTalkTurnToDisplay(result.turn);
            
            // Check if Cogito responded
            if (result.cogitoResponse) {
                console.log('🤖 Talk tab: Cogito response received!', result.cogitoResponse);
                // Add Cogito's response turn to display
                addTalkTurnToDisplay(result.cogitoResponse);
            } else if (result.addressing.isComment) {
                console.log('💬 Talk tab: Comment posted (no Cogito response expected)');
            }
        } else {
            console.error('Failed to send talk message:', result.error);
        }
        
    } catch (error) {
        console.error('Error sending talk message:', error);
    }
}

// Ensure we have a client ID for Talk
function ensureTalkClient() {
    // Get client ID from localStorage or session
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const oldClientId = talkClientId;
    talkClientId = user.client_id;
    
    if (oldClientId !== talkClientId) {
        console.log('🔄 Talk client changed from', oldClientId, 'to', talkClientId);
    }
    
    if (!talkClientId) {
        // Try to get from settings dropdown
        const clientSelect = document.getElementById('settingsClient');
        if (clientSelect && clientSelect.value) {
            talkClientId = parseInt(clientSelect.value);
        }
    }
    
    if (!talkClientId) {
        console.error('No client ID available for Talk');
        alert('Please select a client first');
        throw new Error('No client ID available');
    }
    
    return talkClientId;
}

// Add turn to display (append to bottom)
function addTalkTurnToDisplay(turn) {
    console.log('🎯 addTalkTurnToDisplay called with:', turn);
    const container = document.getElementById('talk-turns-container');
    if (!container) {
        console.error('❌ No talk-turns-container found!');
        return;
    }
    
    const turnDiv = createTurnElement(turn);
    container.appendChild(turnDiv);
    
    // Scroll to bottom for new turns
    const turnsArea = document.getElementById('talk-turns');
    if (turnsArea) {
        turnsArea.scrollTop = turnsArea.scrollHeight;
    }
    
    // Add to turns array
    talkTurns.push(turn);
}

// Prepend turn to display (add to top for older turns)
function prependTalkTurnToDisplay(turn) {
    console.log('🎯 prependTalkTurnToDisplay called with:', turn);
    const container = document.getElementById('talk-turns-container');
    if (!container) {
        console.error('❌ No talk-turns-container found!');
        return;
    }
    
    const turnDiv = createTurnElement(turn);
    
    // Check if we should show a "loading older messages" indicator
    if (!document.getElementById('loading-older-indicator')) {
        const loadingOlder = document.createElement('div');
        loadingOlder.id = 'loading-older-indicator';
        loadingOlder.className = 'text-center text-gray-500 text-sm p-2 border-b';
        loadingOlder.textContent = talkPagination.hasMore ? 
            `📜 Loaded ${talkPagination.loaded}/${talkPagination.total} messages` :
            `📜 All ${talkPagination.total} messages loaded`;
        container.insertBefore(loadingOlder, container.firstChild);
    } else {
        // Update the indicator
        const indicator = document.getElementById('loading-older-indicator');
        indicator.textContent = talkPagination.hasMore ? 
            `📜 Loaded ${talkPagination.loaded}/${talkPagination.total} messages` :
            `📜 All ${talkPagination.total} messages loaded`;
    }
    
    // Insert after the loading indicator
    const indicator = document.getElementById('loading-older-indicator');
    container.insertBefore(turnDiv, indicator.nextSibling);
}

// Create turn element (shared function)
function createTurnElement(turn) {
    const turnDiv = document.createElement('div');
    turnDiv.className = 'p-3 rounded-md border';
    
    // Color code based on user vs AI
    if (turn.user_id) {
        turnDiv.className += ' bg-blue-50 border-blue-200';
    } else {
        turnDiv.className += ' bg-green-50 border-green-200';
    }
    
    const addressing = turn.metadata?.addressing || {};
    
    // Handle different timestamp fields
    const timestamp = turn.timestamp || turn.created_at;
    const displayTime = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Unknown time';
    
    // Handle content that might be missing
    const content = turn.content || '';
    
    turnDiv.innerHTML = `
        <div class="flex justify-between items-start mb-1">
            <span class="text-sm font-medium text-gray-700">
                ${turn.user_id ? 'You' : 'Cogito'}
            </span>
            <span class="text-xs text-gray-500">
                ${displayTime}
            </span>
        </div>
        <div class="text-gray-800">${escapeHtml(content)}</div>
        ${addressing.shouldInvokeCogito ? '<div class="text-xs text-blue-600 mt-1">🤖 Invoked Cogito</div>' : ''}
        ${addressing.isComment ? '<div class="text-xs text-gray-500 mt-1">💬 Comment</div>' : ''}
    `;
    
    return turnDiv;
}

// Show loading message for Cogito response
function showTalkLoadingMessage() {
    const container = document.getElementById('talk-turns-container');
    if (!container) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'p-3 rounded-md border bg-green-50 border-green-200';
    loadingDiv.id = 'cogito-loading';
    
    loadingDiv.innerHTML = `
        <div class="flex justify-between items-start mb-1">
            <span class="text-sm font-medium text-gray-700">Cogito</span>
            <span class="text-xs text-gray-500">now</span>
        </div>
        <div class="text-gray-600 italic">Thinking...</div>
    `;
    
    container.appendChild(loadingDiv);
    
    // Scroll to bottom
    const turnsArea = document.getElementById('talk-turns');
    if (turnsArea) {
        turnsArea.scrollTop = turnsArea.scrollHeight;
    }
}

// Remove loading message
function removeTalkLoadingMessage() {
    const loadingDiv = document.getElementById('cogito-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Refresh turns from server (load latest 100 turns)
async function refreshTalkTurns(loadOlder = false) {
    console.log('🔄 Talk tab: refreshTalkTurns called, clientId:', talkClientId, 'loadOlder:', loadOlder);
    
    if (!talkClientId) {
        console.log('❌ Talk tab: No client ID for refresh');
        return;
    }
    
    if (talkPagination.loading) {
        console.log('⏳ Talk tab: Already loading, skipping request');
        return;
    }
    
    try {
        talkPagination.loading = true;
        
        let url = `/api/talk/turns/${talkClientId}?limit=100`;
        
        if (loadOlder && talkTurns.length > 0) {
            // Load older turns before the first turn we have
            const firstTurn = talkTurns[0];
            url += `&before_turn_id=${firstTurn.id}`;
            console.log('📡 Talk tab: Loading older turns before:', firstTurn.id);
        } else {
            console.log('📡 Talk tab: Loading latest turns');
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            console.log('❌ Talk tab: Response not OK:', response.status);
            return;
        }
        
        const result = await response.json();
        console.log('✅ Talk tab: Received result:', result);
        
        if (result.success && result.turns) {
            const serverTurns = result.turns || [];
            talkPagination.total = result.pagination?.total || 0;
            talkPagination.hasMore = result.pagination?.has_more || false;
            
            console.log('📊 Talk tab: Server returned', serverTurns.length, 'turns, total:', talkPagination.total);
            
            if (loadOlder) {
                // Prepend older turns to the beginning
                serverTurns.forEach(turn => {
                    if (!talkTurns.find(localTurn => localTurn.id === turn.id)) {
                        talkTurns.unshift(turn);
                        prependTalkTurnToDisplay(turn);
                    }
                });
                
                // Scroll back down a bit to maintain position
                setTimeout(() => {
                    const turnsArea = document.getElementById('talk-turns');
                    if (turnsArea) {
                        turnsArea.scrollTop = 200; // Keep some of the new turns visible
                    }
                }, 50);
                
            } else {
                // Initial load or refresh - find new turns
                const newTurns = serverTurns.filter(serverTurn => 
                    !talkTurns.find(localTurn => localTurn.id === serverTurn.id)
                );
                
                console.log('🆕 Talk tab: Found', newTurns.length, 'new turns');
                
                if (newTurns.length > 0) {
                    // Remove loading message
                    removeTalkLoadingMessage();
                    
                    // Add new turns to display
                    newTurns.forEach(turn => {
                        console.log('➕ Talk tab: Adding turn:', turn.id, turn.user_id ? 'USER' : 'AI');
                        addTalkTurnToDisplay(turn);
                    });
                    
                    // Check if we got a Cogito response (AI turn)
                    const hasAiResponse = newTurns.some(turn => !turn.user_id);
                    if (hasAiResponse) {
                        console.log('✅ Talk tab: Cogito response received and displayed!');
                    }
                }
            }
            
            talkPagination.loaded = talkTurns.length;
        }
        
    } catch (error) {
        console.error('❌ Error refreshing talk turns:', error);
    } finally {
        talkPagination.loading = false;
    }
}

// Load Talk tab when it becomes active
function loadTalkTab() {
    console.log('🔄 Loading Talk tab...');
    
    // Clear existing turns and reset pagination
    const container = document.getElementById('talk-turns-container');
    if (container) {
        console.log('📝 Clearing existing turns, had:', talkTurns.length);
        container.innerHTML = '';
        talkTurns = [];
    }
    
    // Reset pagination state
    talkPagination = {
        total: 0,
        loaded: 0,
        hasMore: true,
        loading: false
    };
    
    // Ensure we have a client ID
    try {
        const newClientId = ensureTalkClient();
        console.log('👤 Talk tab loading for client:', newClientId);
    } catch (error) {
        console.error('Cannot load Talk tab:', error);
        return;
    }
    
    // Load existing turns (will load latest 100)
    refreshTalkTurns().then(() => {
        // Focus input
        const input = document.getElementById('talk-input');
        if (input) {
            input.focus();
        }
    }).catch(error => {
        console.error('Error loading existing turns:', error);
        
        // Focus input even on error
        const input = document.getElementById('talk-input');
        if (input) {
            input.focus();
        }
    });
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.handleTalkKeyPress = handleTalkKeyPress;
window.sendTalkMessage = sendTalkMessage;
window.loadTalkTab = loadTalkTab;
window.initializeTalk = initializeTalk;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeTalk();
});