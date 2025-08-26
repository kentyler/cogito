// Bot Creation State Module - Manages state for bot creation

(function() {
    'use strict';

    // State object
    const state = {
        loading: false,
        message: null,
        bots: [],
        runningBots: [],
        stuckMeetings: [],
        fetchingBots: false,
        fetchingStuckMeetings: false,
        shuttingDown: {},
        completing: {}
    };

    // State getters
    function getState() {
        return state;
    }

    function isLoading() {
        return state.loading;
    }

    function getBots() {
        return state.bots;
    }

    function getRunningBots() {
        return state.runningBots;
    }

    function getStuckMeetings() {
        return state.stuckMeetings;
    }

    function getShuttingDownStatus(botId) {
        return state.shuttingDown[botId] || false;
    }

    function getCompletingStatus(meetingId) {
        return state.completing[meetingId] || false;
    }

    // State setters
    function setLoading(loading) {
        state.loading = loading;
    }

    function setMessage(message) {
        state.message = message;
    }

    function setBots(bots) {
        state.bots = bots;
    }

    function addBot(bot) {
        state.bots.unshift(bot);
    }

    function setRunningBots(bots) {
        state.runningBots = bots;
    }

    function setStuckMeetings(meetings) {
        state.stuckMeetings = meetings;
    }

    function setFetchingBots(fetching) {
        state.fetchingBots = fetching;
    }

    function setFetchingStuckMeetings(fetching) {
        state.fetchingStuckMeetings = fetching;
    }

    function setShuttingDown(botId, status) {
        if (status) {
            state.shuttingDown[botId] = true;
        } else {
            delete state.shuttingDown[botId];
        }
    }

    function setCompleting(meetingId, status) {
        if (status) {
            state.completing[meetingId] = true;
        } else {
            delete state.completing[meetingId];
        }
    }

    // Public API
    window.botCreationState = {
        getState,
        isLoading,
        getBots,
        getRunningBots,
        getStuckMeetings,
        getShuttingDownStatus,
        getCompletingStatus,
        setLoading,
        setMessage,
        setBots,
        addBot,
        setRunningBots,
        setStuckMeetings,
        setFetchingBots,
        setFetchingStuckMeetings,
        setShuttingDown,
        setCompleting
    };
})();