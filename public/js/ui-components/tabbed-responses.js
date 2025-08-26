// Tabbed response rendering and interaction

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

// Make functions available globally
window.renderTabbedResponse = renderTabbedResponse;