// Meeting UI management functions

window.setMeetingsStatus = function(message, type = 'info') {
    const statusDiv = document.getElementById('meetings-status');
    if (!statusDiv) {
        // Meetings tab removed - log status instead
        console.log(`[Status ${type}]: ${message}`);
        return;
    }
    const colors = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200'
    };
    statusDiv.innerHTML = `<div class="p-2 text-xs rounded border ${colors[type]}">${message}</div>`;
}

window.selectMeeting = async function(meetingId, meetingName) {
    document.getElementById('meetingId').value = meetingId;
    
    // Store meeting name for later use
    window.currentMeetingName = meetingName;
    
    // Update the meeting content title to show the meeting name
    const titleElement = document.querySelector('#meetings-content h1');
    if (titleElement) {
        titleElement.textContent = meetingName;
    }
    
    // Clear the status message
    document.getElementById('status').innerHTML = '';
    
    // Show the prompt form and scroll button
    document.getElementById('prompt-form').classList.remove('hidden');
    document.getElementById('scroll-to-bottom-btn').classList.remove('hidden');
    
    // Update visual selection
    document.querySelectorAll('.meeting-item').forEach(item => {
        item.classList.remove('bg-blue-50', 'border-blue-300');
        item.classList.add('bg-gray-50', 'border-gray-200');
    });
    
    const selectedItem = document.querySelector(`[data-meeting-id="${meetingId}"]`);
    if (selectedItem) {
        selectedItem.classList.remove('bg-gray-50', 'border-gray-200');
        selectedItem.classList.add('bg-blue-50', 'border-blue-300');
    }

    // Auto-load content: try turns first, then transcript
    await window.autoLoadContent(meetingId, meetingName);
}