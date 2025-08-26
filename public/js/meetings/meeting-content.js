// Meeting content loading functions

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