// Meeting list management functions

window.loadMeetingsList = async function() {
    window.setMeetingsStatus('Loading meetings...', 'info');
    document.getElementById('meetings-list').innerHTML = '';

    try {
        console.log('🔍 Fetching meetings list');
        const response = await fetch('/api/meetings', {
            credentials: 'include'
        });

        if (!response.ok) {
            // If unauthorized, clear localStorage and redirect to login
            if (response.status === 401) {
                console.log('Session expired, redirecting to login');
                localStorage.removeItem('user');
                document.getElementById('loginForm').classList.remove('hidden');
                document.getElementById('mainContent').classList.add('hidden');
                throw new Error('Session expired - please log in again');
            }
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
            // If unauthorized, clear localStorage and redirect to login
            if (response.status === 401) {
                console.log('Session expired, redirecting to login');
                localStorage.removeItem('user');
                document.getElementById('loginForm').classList.remove('hidden');
                document.getElementById('mainContent').classList.add('hidden');
                throw new Error('Session expired - please log in again');
            }
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