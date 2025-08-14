// Content rendering and EDN parsing functions

window.setStatus = function(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    const colors = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
    };
    statusDiv.innerHTML = `<div class="p-3 rounded border ${colors[type]}">${message}</div>`;
}

window.renderTurns = function(turns) {
    const contentDiv = document.getElementById('content');
    let html = '';
    
    turns.forEach((turn, index) => {
        const speaker = turn.metadata?.speaker_label || 'Unknown Speaker';
        
        let contentHtml;
        // Check if this is an EDN response that needs parsing
        if (typeof turn.content === 'string' && turn.content.includes(':response-type')) {
            console.log('🔍 Found EDN content in database turn, parsing...');
            const parsed = parseEDNResponse(turn.content);
            
            if (parsed.type === 'response-set' && parsed.alternatives.length > 0) {
                const turnId = `db-turn-${turn.id || index}`;
                contentHtml = renderTabbedResponse(parsed.alternatives, turnId);
            } else {
                contentHtml = `<div class="text-gray-800">${parsed.content}</div>`;
            }
        } else {
            contentHtml = `<div class="text-gray-800">${turn.content || 'No content'}</div>`;
        }
        
        html += `
            <div class="mb-4 p-3 bg-gray-50 rounded-lg border">
                <div class="text-sm font-medium text-gray-900 mb-1">
                    ${speaker} (${index + 1})
                </div>
                ${contentHtml}
            </div>
        `;
    });
    contentDiv.innerHTML = html;
}

window.renderTranscript = function(transcript) {
    const contentDiv = document.getElementById('content');
    const preview = transcript.substring(0, 2000);
    const html = `
        <div class="p-4 bg-yellow-50 rounded-lg border">
            <div class="text-sm font-medium text-gray-900 mb-2">Full Transcript</div>
            <div class="text-gray-800 whitespace-pre-wrap text-sm">
                ${preview}${transcript.length > 2000 ? '...' : ''}
            </div>
        </div>
    `;
    contentDiv.innerHTML = html;
}

// Simple EDN parser for basic response structures
function parseEDNResponse(ednString) {
    try {
        // Remove leading/trailing whitespace
        const cleaned = ednString.trim();
        
        // Check if it's a response-set (multi-tab response)
        if (cleaned.includes(':response-type :response-set')) {
            return parseResponseSet(cleaned);
        } else if (cleaned.includes(':response-type :text')) {
            return parseTextResponse(cleaned);
        } else {
            // Fallback - treat as plain text
            return { type: 'text', content: ednString };
        }
    } catch (error) {
        console.error('EDN parsing error:', error);
        return { type: 'text', content: ednString };
    }
}

function parseTextResponse(ednString) {
    // Extract content from {:response-type :text :content "..."}
    const contentMatch = ednString.match(/:content\s+"([^"]+(?:\\.[^"]*)*)"/) || 
                        ednString.match(/:content\s+"([^"]*)"/) ||
                        ednString.match(/:content\s+([^}]+)/);
    
    if (contentMatch) {
        let content = contentMatch[1];
        // Unescape quotes
        content = content.replace(/\\"/g, '"');
        return { type: 'text', content: content };
    }
    
    return { type: 'text', content: ednString };
}

function parseResponseSet(ednString) {
    // Extract alternatives array from response-set
    const alternatives = [];
    
    try {
        console.log('🔍 Parsing response set, looking for alternatives...');
        
        // Simple but effective approach: split by {:id and process each block
        const blocks = ednString.split('{:id ').slice(1); // Remove first empty element
        
        console.log('🔍 Found', blocks.length, 'potential alternative blocks');
        
        for (const block of blocks) {
            try {
                // Extract id
                const idMatch = block.match(/^"([^"]+)"/);
                if (!idMatch) continue;
                const id = idMatch[1];
                
                // Extract summary  
                const summaryMatch = block.match(/:summary\s+"([^"]+)"/);
                if (!summaryMatch) continue;
                const summary = summaryMatch[1];
                
                // Check if it's a list type with items
                const isListType = block.includes(':response-type :list');
                
                let content = '';
                if (isListType) {
                    // Extract items array and convert to bulleted list
                    const itemsMatch = block.match(/:items\s+\[(.*?)\](?:\s+:rationale|$)/s);
                    if (itemsMatch) {
                        const itemsStr = itemsMatch[1];
                        // Split by quotes and filter out actual content
                        const items = itemsStr.match(/"([^"]+)"/g) || [];
                        content = items
                            .map(item => item.slice(1, -1)) // Remove quotes
                            .map(item => `• ${item}`)
                            .join('\n');
                    }
                } else {
                    // Extract content for text type
                    const contentMatch = block.match(/:content\s+"([^"]+)"/);
                    if (contentMatch) {
                        content = contentMatch[1];
                    }
                }
                
                if (content) {
                    alternatives.push({
                        id: id,
                        summary: summary,
                        content: content
                    });
                    console.log('✅ Parsed alternative:', id, '-', summary);
                }
                
            } catch (blockError) {
                console.error('Error parsing alternative block:', blockError);
            }
        }
        
    } catch (error) {
        console.error('Error parsing response set:', error);
    }
    
    console.log('🔍 Final parsed alternatives:', alternatives.length);
    return {
        type: 'response-set',
        alternatives: alternatives
    };
}

// Function to render tabbed response
function renderTabbedResponse(alternatives, turnId) {
    console.log('🔍 renderTabbedResponse called with:', alternatives.length, 'alternatives, turnId:', turnId);
    
    const tabsHtml = alternatives.map((alt, index) => 
        `<button class="tab-btn px-4 py-2 text-sm border-b-2 ${index === 0 ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} hover:text-gray-700" 
                 onclick="window.switchResponseTab('${turnId}', ${index})">${alt.summary}</button>`
    ).join('');
    
    const contentHtml = alternatives.map((alt, index) => 
        `<div class="tab-content ${index === 0 ? '' : 'hidden'}" data-tab="${index}">
            <div class="text-gray-800 whitespace-pre-wrap">${alt.content}</div>
        </div>`
    ).join('');
    
    const result = `
        <div class="response-tabs" data-turn-id="${turnId}">
            <div class="border-b border-gray-200 mb-3">
                ${tabsHtml}
            </div>
            <div class="tab-content-area">
                ${contentHtml}
            </div>
        </div>
    `;
    
    console.log('🔍 Generated HTML:', result.substring(0, 200) + '...');
    return result;
}

// Function to switch between response tabs
window.switchResponseTab = function(turnId, tabIndex) {
    const responseDiv = document.querySelector(`[data-turn-id="${turnId}"]`);
    if (!responseDiv) return;
    
    // Update tab buttons
    responseDiv.querySelectorAll('.tab-btn').forEach((btn, index) => {
        if (index === tabIndex) {
            btn.classList.remove('border-transparent', 'text-gray-500');
            btn.classList.add('border-blue-500', 'text-blue-600');
        } else {
            btn.classList.remove('border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        }
    });
    
    // Update content
    responseDiv.querySelectorAll('.tab-content').forEach((content, index) => {
        if (index === tabIndex) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

// Function to append a new turn to the display
window.appendTurn = function(turn) {
    const contentDiv = document.getElementById('content');
    const speaker = turn.speaker || turn.metadata?.speaker_label || 'User';
    
    let contentHtml;
    if (typeof turn.content === 'string' && turn.content.includes(':response-type')) {
        // Debug: log the raw response
        console.log('🔍 Raw EDN response:', turn.content);
        
        // Parse EDN response
        const parsed = parseEDNResponse(turn.content);
        console.log('🔍 Parsed response:', parsed);
        
        if (parsed.type === 'response-set' && parsed.alternatives.length > 0) {
            console.log('✅ Creating tabbed response with', parsed.alternatives.length, 'alternatives');
            const turnId = `turn-${Date.now()}`;
            contentHtml = renderTabbedResponse(parsed.alternatives, turnId);
        } else {
            console.log('📝 Using single text response');
            contentHtml = `<div class="text-gray-800 whitespace-pre-wrap">${parsed.content}</div>`;
        }
    } else {
        contentHtml = `<div class="text-gray-800 whitespace-pre-wrap">${turn.content || 'No content'}</div>`;
    }
    
    const turnHtml = `
        <div class="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div class="text-sm font-medium text-gray-900 mb-1">
                ${speaker}
            </div>
            ${contentHtml}
        </div>
    `;
    
    console.log('🔍 About to insert HTML:', turnHtml.substring(0, 300) + '...');
    contentDiv.insertAdjacentHTML('beforeend', turnHtml);
    console.log('🔍 Content div after insert:', contentDiv.innerHTML.length, 'characters');
    
    // Scroll to bottom
    contentDiv.scrollTop = contentDiv.scrollHeight;
}

// Function to scroll to bottom of content
window.scrollToBottom = function() {
    const contentDiv = document.getElementById('content');
    contentDiv.scrollTop = contentDiv.scrollHeight;
    
    // Also scroll the prompt input into view
    const promptForm = document.getElementById('prompt-form');
    if (promptForm) {
        promptForm.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}