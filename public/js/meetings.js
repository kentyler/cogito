// Meeting management functions

window.window.setMeetingsStatus = function(message, type = 'info') {
    const statusDiv = document.getElementById('meetings-status');
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
    await autoLoadContent(meetingId, meetingName);
}

window.autoLoadContent = async function(meetingId, meetingName) {
    try {
        console.log('🔍 Auto-loading content for meeting:', meetingId);
        
        // First, try to load turns directly
        const turnsResponse = await fetch(`/api/admin/meetings/${meetingId}/turns-direct`, {
            credentials: 'include'
        });

        if (turnsResponse.ok) {
            const turnsData = await turnsResponse.json();
            console.log('📥 Direct turns response:', turnsData);

            if (turnsData.turns && turnsData.turns.length > 0) {
                window.renderTurns(turnsData.turns);
                return; // We're done - found turns
            }
        }

        // No turns found, try transcript
        console.log('🔍 No turns found, trying transcript for:', meetingId);
        
        const transcriptResponse = await fetch(`/api/admin/meetings/${meetingId}/transcript`, {
            credentials: 'include'
        });

        if (!transcriptResponse.ok) {
            throw new Error(`HTTP ${transcriptResponse.status}: ${transcriptResponse.statusText}`);
        }

        const transcriptData = await transcriptResponse.json();
        console.log('📥 Transcript response:', transcriptData);

        if (transcriptData.full_transcript) {
            window.renderTranscript(transcriptData.full_transcript);
        } else {
            // Clear any previous content for empty meetings (no warning needed)
            document.getElementById('content').innerHTML = '';
        }

    } catch (error) {
        console.error('❌ Auto-load error:', error);
        window.setStatus(`Error loading ${meetingName}: ${error.message}`, 'error');
    }
}

window.loadMeetingsList = async function() {
    window.window.setMeetingsStatus('Loading meetings...', 'info');
    document.getElementById('meetings-list').innerHTML = '';

    try {
        console.log('🔍 Fetching meetings list');
        const response = await fetch('/api/meetings', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const meetings = await response.json();
        console.log('📥 Meetings response:', meetings);

        if (meetings && meetings.length > 0) {
            window.setMeetingsStatus(`Found ${meetings.length} meetings`, 'success');
            
            let html = '';
            meetings.forEach(meeting => {
                const name = meeting.block_name || 'Unnamed Meeting';
                const shortName = name.length > 40 ? name.substring(0, 37) + '...' : name;
                const turnCount = meeting.turn_count || 0;
                
                html += `
                    <div class="meeting-item p-2 border rounded bg-gray-50 border-gray-200 flex items-center justify-between"
                         data-meeting-id="${meeting.block_id}">
                        <div class="flex-1 cursor-pointer hover:bg-gray-100 p-1 rounded"
                             onclick="selectMeeting('${meeting.block_id}', '${name.replace(/'/g, "\\'")}')">
                            <div class="font-medium text-sm text-gray-900">${shortName}</div>
                            <div class="text-xs text-gray-500">${turnCount} turns</div>
                        </div>
                        <button onclick="deleteMeeting('${meeting.block_id}', '${name.replace(/'/g, "\\'")})')"
                                class="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex-shrink-0">
                            Delete
                        </button>
                    </div>
                `;
            });
            
            document.getElementById('meetings-list').innerHTML = html;
        } else {
            window.setMeetingsStatus('No meetings found', 'info');
        }

    } catch (error) {
        console.error('❌ Error loading meetings:', error);
        window.setMeetingsStatus(`Error: ${error.message}`, 'error');
    }
}

window.deleteMeeting = async function(meetingId, meetingName) {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${meetingName}"?\n\nThis will permanently delete the meeting and all its turns/transcript data.`)) {
        return;
    }

    try {
        console.log('🗑️ Deleting meeting:', meetingId);
        window.setMeetingsStatus(`Deleting: ${meetingName}`, 'info');

        const response = await fetch(`/api/meetings/${meetingId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📥 Delete response:', result);

        window.setMeetingsStatus(`Successfully deleted: ${meetingName}`, 'success');
        
        // Remove the meeting from the UI
        const meetingElement = document.querySelector(`[data-meeting-id="${meetingId}"]`);
        if (meetingElement) {
            meetingElement.remove();
        }

        // Clear content if this was the selected meeting
        const currentMeetingId = document.getElementById('meetingId').value;
        if (currentMeetingId === meetingId) {
            document.getElementById('meetingId').value = '';
            document.getElementById('content').innerHTML = '';
            setStatus('Meeting deleted', 'info');
        }

        // Update the meetings count
        const remainingMeetings = document.querySelectorAll('.meeting-item').length;
        window.setMeetingsStatus(`${remainingMeetings} meetings remaining`, 'success');

    } catch (error) {
        console.error('❌ Delete error:', error);
        window.setMeetingsStatus(`Error deleting ${meetingName}: ${error.message}`, 'error');
    }
}

// Function to create a new meeting
window.createNewMeeting = async function() {
    try {
        // Get user info for the title
        const userStr = localStorage.getItem('user');
        let userName = 'User';
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // Extract first name from email or use full email
                userName = user.email.split('@')[0];
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // Generate a human-readable default title with user name
        const now = new Date();
        const dateTime = now.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        const defaultTitle = `${userName} - ${dateTime}`;
        
        const meetingName = prompt(`Enter meeting name:`, defaultTitle);
        if (!meetingName) return; // User cancelled
        
        window.setMeetingsStatus('Creating new meeting...', 'info');
        
        const response = await fetch('/api/meetings/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meeting_name: meetingName
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create meeting');
        }
        
        const newMeeting = await response.json();
        console.log('✅ New meeting created:', newMeeting);
        
        // Refresh meetings list
        await loadMeetingsList();
        
        // Auto-select the new meeting
        selectMeeting(newMeeting.meeting_id, newMeeting.name);
        
        window.setMeetingsStatus(`Created: ${meetingName}`, 'success');
        
    } catch (error) {
        console.error('❌ Error creating meeting:', error);
        window.setMeetingsStatus(`Error: ${error.message}`, 'error');
    }
}