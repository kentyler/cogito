// Bot Creation API Module - Handles all API calls

(function() {
    'use strict';

    // API endpoints
    const API = {
        CREATE_BOT: '/api/create-bot',
        GET_BOTS: '/api/bots',
        SHUTDOWN_BOT: (botId) => `/api/bots/${botId}/leave`,
        GET_STUCK_MEETINGS: '/api/stuck-meetings',
        COMPLETE_MEETING: (meetingId) => `/api/stuck-meetings/${meetingId}/complete`
    };

    // Create a new bot
    async function createBot(meetingUrl, meetingName) {
        const response = await fetch(API.CREATE_BOT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meeting_url: meetingUrl,
                meeting_name: meetingName
            })
        });

        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { error: 'Server error', details: text };
        }
        
        if (!response.ok) {
            throw new Error(data.details || data.error || 'Failed to create bot');
        }
        
        return data;
    }

    // Fetch running bots
    async function fetchRunningBots() {
        const response = await fetch(API.GET_BOTS);
        
        if (!response.ok) {
            throw new Error('Failed to fetch bots');
        }
        
        return await response.json();
    }

    // Shutdown a bot
    async function shutdownBot(botId) {
        const response = await fetch(API.SHUTDOWN_BOT(botId), {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to shut down bot');
        }

        return await response.json();
    }

    // Fetch stuck meetings
    async function fetchStuckMeetings() {
        const response = await fetch(API.GET_STUCK_MEETINGS);
        
        if (!response.ok) {
            throw new Error('Failed to fetch stuck meetings');
        }
        
        return await response.json();
    }

    // Force complete a stuck meeting
    async function forceCompleteMeeting(meetingId) {
        const response = await fetch(API.COMPLETE_MEETING(meetingId), {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to complete meeting');
        }

        return await response.json();
    }

    // Public API
    window.botCreationAPI = {
        createBot,
        fetchRunningBots,
        shutdownBot,
        fetchStuckMeetings,
        forceCompleteMeeting
    };
})();