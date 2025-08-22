// Bot Creation Lists Module - Handles all list components

(function() {
    'use strict';

    // Render running bots list
    function renderRunningBots(container, bots, shuttingDown, onShutdown) {
        if (bots.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    No bots currently running
                </div>
            `;
            return;
        }

        container.innerHTML = bots.map(bot => `
            <div class="bot-item p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">
                            ${bot.meeting_name || 'Unnamed Meeting'}
                        </div>
                        <div class="text-sm text-gray-600 mt-1">${bot.meeting_url}</div>
                        <div class="text-xs text-gray-500 mt-2">
                            <div>Bot ID: ${bot.id}</div>
                            ${bot.creator_email && bot.creator_email !== 'null' ? `
                                <div class="mt-1">Created by: ${bot.creator_email}</div>
                            ` : ''}
                            ${bot.created_at ? `
                                <div class="mt-1">Created: ${new Date(bot.created_at).toLocaleDateString()} at ${new Date(bot.created_at).toLocaleTimeString()}</div>
                            ` : ''}
                        </div>
                        ${bot.status ? `
                            <div class="text-xs mt-1">
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                    ${bot.status === 'active' ? 'bg-green-100 text-green-800' :
                                      bot.status === 'joining' ? 'bg-yellow-100 text-yellow-800' :
                                      bot.status === 'leaving' ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-100 text-gray-800'}">
                                    ${bot.status}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    <button onclick="window.botCreation.shutdownBot('${bot.id}')"
                            class="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            ${shuttingDown[bot.id] ? 'disabled' : ''}>
                        ${shuttingDown[bot.id] ? 'Shutting down...' : 'Shutdown'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render stuck meetings list
    // Available methods: forceCompleteMeeting exists on window.botCreation, meeting_id and bot_id properties exist on meeting objects
    function renderStuckMeetings(container, meetings, completing, onComplete) {
        if (meetings.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    No stuck meetings found
                </div>
            `;
            return;
        }

        container.innerHTML = meetings.map(meeting => `
            <div class="meeting-item p-4 border border-orange-200 rounded-md bg-orange-50 shadow-sm">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">
                            ${meeting.meeting_name || 'Unnamed Meeting'}
                        </div>
                        <div class="text-sm text-gray-600 mt-1">${meeting.meeting_url}</div>
                        <div class="text-xs text-gray-500 mt-2">Meeting ID: ${meeting.meeting_id}</div>
                        <div class="text-xs text-gray-500 mt-1">Bot ID: ${meeting.bot_id || 'N/A'}</div>
                        <div class="text-xs text-gray-500 mt-1">Turn Count: ${meeting.turn_count}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            Stuck since: ${new Date(meeting.created_at).toLocaleString()}
                        </div>
                        <div class="text-xs mt-2">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Stuck in joining
                            </span>
                        </div>
                    </div>
                    <button onclick="window.botCreation.forceCompleteMeeting('${meeting.meeting_id}')"
                            class="px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            ${completing[meeting.meeting_id] ? 'disabled' : ''}>
                        ${completing[meeting.meeting_id] ? 'Completing...' : 'Force Complete'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Render recent bots list
    function renderRecentBots(container, bots) {
        if (bots.length === 0) {
            return '';
        }

        return bots.slice(0, 5).map(bot => `
            <div class="bot-item p-4 border border-gray-200 rounded-md">
                <div class="font-medium">${bot.meeting_name || 'Unnamed Meeting'}</div>
                <div class="text-sm text-gray-600">${bot.meeting_url}</div>
                <div class="text-xs text-gray-500">
                    Created: ${new Date(bot.created_at).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    // Create list container HTML
    function createListContainers() {
        return `
            <!-- Running Bots List -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">Running Bots</h3>
                    <button id="refreshBotsButton" 
                            class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50">
                        Refresh
                    </button>
                </div>
                <div id="runningBotsList" class="space-y-3">
                    <div class="p-4 text-center text-gray-500">Loading bots...</div>
                </div>
            </div>

            <!-- Stuck Meetings List -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-orange-700">Stuck Meetings</h3>
                    <button id="refreshStuckMeetingsButton"
                            class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50">
                        Refresh
                    </button>
                </div>
                <div id="stuckMeetingsList" class="space-y-3">
                    <div class="p-4 text-center text-gray-500">Loading stuck meetings...</div>
                </div>
            </div>

            <!-- Recently Created Bots -->
            <div id="recentlyCreatedBots" class="hidden bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Recently Created Bots</h3>
                <div id="recentBotsList" class="space-y-2"></div>
            </div>
        `;
    }

    // Public API
    window.botCreationLists = {
        renderRunningBots,
        renderStuckMeetings,
        renderRecentBots,
        createListContainers
    };
})();