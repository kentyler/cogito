// Main content rendering functions
// Dependencies: ui-utils.js, edn-parser.js, tabbed-responses.js

window.renderTurns = function(turns) {
    const contentDiv = document.getElementById('content');
    let html = '';
    
    turns.forEach((turn, index) => {
        const speaker = turn.metadata?.speaker_label || 'Unknown Speaker';
        
        let contentHtml;
        // Check if this is an EDN response that needs parsing
        if (typeof turn.content === 'string' && turn.content.includes(':response-type')) {
            console.log('🔍 Found EDN content in database turn, parsing...');
            const parsed = window.parseEDNResponse(turn.content);
            
            if (parsed.type === 'response-set' && parsed.alternatives.length > 0) {
                const turnId = `db-turn-${turn.id || index}`;
                contentHtml = window.renderTabbedResponse(parsed.alternatives, turnId);
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
    contentDiv.innerHTML = `
        <div class="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div class="text-sm font-medium text-gray-900 mb-1">Transcript</div>
            <div class="text-gray-800 whitespace-pre-wrap">${transcript}</div>
        </div>
    `;
}

window.appendTurn = function(turn) {
    const contentDiv = document.getElementById('content');
    const speaker = turn.metadata?.speaker_label || 'AI Assistant';
    
    let contentHtml;
    if (typeof turn.content === 'string' && turn.content.includes(':response-type')) {
        console.log('🔍 Found EDN content in live turn, parsing...');
        const parsed = window.parseEDNResponse(turn.content);
        
        if (parsed.type === 'response-set' && parsed.alternatives.length > 0) {
            const turnId = `live-turn-${Date.now()}`;
            contentHtml = window.renderTabbedResponse(parsed.alternatives, turnId);
        } else {
            contentHtml = `<div class="text-gray-800">${parsed.content}</div>`;
        }
    } else {
        contentHtml = `<div class="text-gray-800">${turn.content || 'No content'}</div>`;
    }
    
    const turnHtml = `
        <div class="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div class="text-sm font-medium text-gray-900 mb-1">${speaker}</div>
            ${contentHtml}
        </div>
    `;
    
    contentDiv.innerHTML += turnHtml;
}