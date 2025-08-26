// Bot Creation Handlers Module - Event handlers for bot creation

(function() {
    'use strict';

    // Handle bot creation submission
    // Available methods: createBot exists on botCreationAPI
    async function handleCreateBot(meetingUrl, meetingName, formElements) {
        window.botCreationForm.setLoading(formElements, true);
        window.botCreationForm.hideMessage(formElements.message);

        try {
            const data = await window.botCreationAPI.createBot(meetingUrl, meetingName);
            
            window.botCreationForm.showMessage(
                formElements.message,
                'Bot created successfully! The bot will join your meeting.',
                'success'
            );
            
            // Add to recent bots
            window.botCreationState.addBot(data);
            
            // Clear form
            window.botCreationForm.clearForm(formElements);
            
            return data;
        } catch (error) {
            console.error('Error creating bot:', error);
            window.botCreationForm.showMessage(
                formElements.message,
                error.message || 'Failed to create bot. Please try again.',
                'error'
            );
            throw error;
        } finally {
            window.botCreationForm.setLoading(formElements, false);
        }
    }

    // Handle bot shutdown
    async function handleShutdownBot(botId, formElements) {
        window.botCreationState.setShuttingDown(botId, true);

        try {
            await window.botCreationAPI.shutdownBot(botId);
            window.botCreationForm.showMessage(
                formElements.message,
                'Bot shut down successfully',
                'success'
            );
            return true;
        } catch (error) {
            console.error('Error shutting down bot:', error);
            window.botCreationForm.showMessage(
                formElements.message,
                'Failed to shut down bot',
                'error'
            );
            return false;
        } finally {
            window.botCreationState.setShuttingDown(botId, false);
        }
    }

    // Handle force complete meeting
    // Available methods: forceCompleteMeeting exists on botCreationAPI
    async function handleForceCompleteMeeting(meetingId, formElements) {
        window.botCreationState.setCompleting(meetingId, true);

        try {
            await window.botCreationAPI.forceCompleteMeeting(meetingId);
            window.botCreationForm.showMessage(
                formElements.message,
                'Meeting marked as completed',
                'success'
            );
            return true;
        } catch (error) {
            console.error('Error completing meeting:', error);
            window.botCreationForm.showMessage(
                formElements.message,
                'Failed to complete meeting',
                'error'
            );
            return false;
        } finally {
            window.botCreationState.setCompleting(meetingId, false);
        }
    }

    // Public API
    window.botCreationHandlers = {
        handleCreateBot,
        handleShutdownBot,
        handleForceCompleteMeeting
    };
})();