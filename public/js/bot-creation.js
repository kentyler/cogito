// Bot Creation Module - Main coordinator for bot creation functionality

(function() {
    'use strict';

    // DOM element references
    let elements = {};
    let formElements = {};

    // Initialize the bot creation interface
    function init() {
        const container = document.getElementById('bot-creation-content');
        if (!container) return;

        // Create main structure
        // Available methods: createListContainers exists on botCreationLists
        container.innerHTML = `
            <div class="bot-creation-container">
                <div id="botFormContainer"></div>
                ${window.botCreationLists.createListContainers()}
            </div>
        `;

        // Render form
        const formContainer = document.getElementById('botFormContainer');
        formElements = window.botCreationForm.render(formContainer, window.botCreationState.getState(), {
            onSubmit: handleCreateBot
        });

        // Cache element references
        // Available methods: getElementById exists on document
        elements = {
            runningBotsList: document.getElementById('runningBotsList'),
            stuckMeetingsList: document.getElementById('stuckMeetingsList'),
            recentBotsList: document.getElementById('recentBotsList'),
            recentlyCreatedBots: document.getElementById('recentlyCreatedBots'),
            refreshBotsButton: document.getElementById('refreshBotsButton'),
            refreshStuckMeetingsButton: document.getElementById('refreshStuckMeetingsButton')
        };

        // Set up event listeners
        setupEventListeners();

        // Initial data load
        fetchRunningBots();
        fetchStuckMeetings();
    }

    function setupEventListeners() {
        elements.refreshBotsButton.addEventListener('click', fetchRunningBots);
        elements.refreshStuckMeetingsButton.addEventListener('click', fetchStuckMeetings);
    }

    async function handleCreateBot(meetingUrl, meetingName) {
        try {
            await window.botCreationHandlers.handleCreateBot(meetingUrl, meetingName, formElements);
            updateRecentBotsList();
            await fetchRunningBots();
        } catch (error) {
            // Error already handled in handler
        }
    }

    async function fetchRunningBots() {
        window.botCreationState.setFetchingBots(true);
        elements.refreshBotsButton.disabled = true;
        elements.refreshBotsButton.textContent = 'Refreshing...';

        try {
            const bots = await window.botCreationAPI.fetchRunningBots();
            window.botCreationState.setRunningBots(bots);
            window.botCreationLists.renderRunningBots(
                elements.runningBotsList,
                window.botCreationState.getRunningBots(),
                window.botCreationState.getState().shuttingDown,
                shutdownBot
            );
        } catch (error) {
            console.error('Error fetching bots:', error);
            window.botCreationState.setRunningBots([]);
            elements.runningBotsList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    Failed to load bots
                </div>
            `;
        } finally {
            window.botCreationState.setFetchingBots(false);
            elements.refreshBotsButton.disabled = false;
            elements.refreshBotsButton.textContent = 'Refresh';
        }
    }

    async function fetchStuckMeetings() {
        window.botCreationState.setFetchingStuckMeetings(true);
        elements.refreshStuckMeetingsButton.disabled = true;
        elements.refreshStuckMeetingsButton.textContent = 'Refreshing...';

        try {
            const meetings = await window.botCreationAPI.fetchStuckMeetings();
            window.botCreationState.setStuckMeetings(meetings);
            window.botCreationLists.renderStuckMeetings(
                elements.stuckMeetingsList,
                window.botCreationState.getStuckMeetings(),
                window.botCreationState.getState().completing,
                forceCompleteMeeting
            );
        } catch (error) {
            console.error('Error fetching stuck meetings:', error);
            window.botCreationState.setStuckMeetings([]);
            elements.stuckMeetingsList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    Failed to load stuck meetings
                </div>
            `;
        } finally {
            window.botCreationState.setFetchingStuckMeetings(false);
            elements.refreshStuckMeetingsButton.disabled = false;
            elements.refreshStuckMeetingsButton.textContent = 'Refresh';
        }
    }

    function updateRecentBotsList() {
        const bots = window.botCreationState.getBots();
        if (bots.length === 0) {
            elements.recentlyCreatedBots.classList.add('hidden');
            return;
        }

        elements.recentlyCreatedBots.classList.remove('hidden');
        elements.recentBotsList.innerHTML = window.botCreationLists.renderRecentBots(
            elements.recentBotsList,
            bots
        );
    }

    async function shutdownBot(botId) {
        window.botCreationLists.renderRunningBots(
            elements.runningBotsList,
            window.botCreationState.getRunningBots(),
            window.botCreationState.getState().shuttingDown,
            shutdownBot
        );
        
        const success = await window.botCreationHandlers.handleShutdownBot(botId, formElements);
        if (success) {
            // Small delay to ensure database update completes
            setTimeout(async () => {
                await fetchRunningBots();
            }, 500);
        }
    }

    async function forceCompleteMeeting(meetingId) {
        window.botCreationLists.renderStuckMeetings(
            elements.stuckMeetingsList,
            window.botCreationState.getStuckMeetings(),
            window.botCreationState.getState().completing,
            forceCompleteMeeting
        );
        
        // Available methods: handleForceCompleteMeeting exists on botCreationHandlers
        const success = await window.botCreationHandlers.handleForceCompleteMeeting(meetingId, formElements);
        if (success) {
            await fetchStuckMeetings();
        }
    }

    // Public API
    window.botCreation = {
        init,
        shutdownBot,
        forceCompleteMeeting
    };
})();