/**
 * Kanban Integration for Claude Code
 * Simple functions to interact with Kanban board from this interface
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Helper functions for Claude Code to interact with Kanban

async function listKanbanGames() {
  try {
    const response = await axios.get(`${API_BASE}/games`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to list games: ${error.response?.data?.error || error.message}`);
  }
}

async function createKanbanGame(gameName, gameType = 'sprint') {
  try {
    const response = await axios.post(`${API_BASE}/games`, { gameName, gameType });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create game: ${error.response?.data?.error || error.message}`);
  }
}

async function addKanbanColumn(gameId, boardId, columnName, wipLimit = null) {
  try {
    const response = await axios.post(`${API_BASE}/games/${gameId}/columns`, {
      boardId, columnName, wipLimit
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create column: ${error.response?.data?.error || error.message}`);
  }
}

async function addKanbanTask(gameId, boardId, taskTitle, taskType = 'TASK') {
  try {
    const response = await axios.post(`${API_BASE}/games/${gameId}/tasks`, {
      boardId, taskTitle, taskType
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create task: ${error.response?.data?.error || error.message}`);
  }
}

async function getKanbanConversation(gameId) {
  try {
    const response = await axios.get(`${API_BASE}/games/${gameId}/conversation`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get conversation: ${error.response?.data?.error || error.message}`);
  }
}

async function requestKanbanSnapshot(gameId, reason) {
  try {
    const response = await axios.post(`${API_BASE}/games/${gameId}/llm-snapshot`, {
      reason, confidence: 0.85
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to request snapshot: ${error.response?.data?.error || error.message}`);
  }
}

module.exports = {
  listKanbanGames,
  createKanbanGame,
  addKanbanColumn,
  addKanbanTask,
  getKanbanConversation,
  requestKanbanSnapshot
};