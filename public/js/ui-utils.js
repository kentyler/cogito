// UI utility functions

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

window.scrollToBottom = function() {
    window.scrollTo(0, document.body.scrollHeight);
}