/**
 * LLM Settings Routes - LLM preference and availability management
 * POST /user/llm-preference - Update user's LLM selection
 * GET /llms - Get available LLMs for user's client
 * GET /user/preferences - Get user's current preferences
 */

import express from 'express';
import { getAvailableLLMs, updateUserSelectedLLM, isValidLLM } from '../lib/llm-config.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

/**
 * Update user's LLM selection
 */
router.post('/user/llm-preference', async (req, res) => {
  try {
    const { llm_id } = req.body;
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!llm_id) {
      return res.status(400).json({ error: 'LLM ID is required' });
    }
    
    if (!(await isValidLLM(llm_id, req.pool))) {
      return res.status(400).json({ error: 'Invalid LLM ID' });
    }
    
    // Get current LLM before updating (for logging)
    let previousLlmId = null;
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      previousLlmId = await dbAgent.users.getUserPreference(userId, 'last_llm_id');
      await dbAgent.close();
    } catch (error) {
      console.warn('Could not fetch previous LLM ID for logging:', error);
    }
    
    // Update user's selected LLM
    await updateUserSelectedLLM(req.pool, userId, llm_id);
    
    // Log LLM selection change
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logEvent('llm_selection_changed', {
        user_id: userId,
        new_llm_id: llm_id,
        previous_llm_id: previousLlmId,
        timestamp: new Date().toISOString()
      }, {
        userId: userId,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        component: 'Settings'
      });
      await dbAgent.close();
    } catch (logError) {
      console.error('Failed to log LLM selection change:', logError);
    }
    
    res.json({
      success: true,
      message: 'LLM selection updated',
      llm_id: llm_id
    });
    
  } catch (error) {
    console.error('Error updating LLM selection:', error);
    res.status(500).json({ 
      error: 'Failed to update LLM selection',
      message: error.message 
    });
  }
});

/**
 * Get available LLMs for the user's client
 */
router.get('/llms', async (req, res) => {
  try {
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user's client ID from user_clients junction table
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const userClient = await dbAgent.users.getUserDefaultClient(userId);
    await dbAgent.close();
    
    if (!userClient) {
      return res.status(404).json({ error: 'User not found or no active client' });
    }
    
    const clientId = userClient.client_id;
    
    const llms = await getAvailableLLMs(req.pool, clientId, userId);
    
    res.json({
      success: true,
      llms: llms
    });
    
  } catch (error) {
    console.error('Error getting LLMs:', error);
    res.status(500).json({ 
      error: 'Failed to get LLMs',
      message: error.message 
    });
  }
});

/**
 * Get user's current preferences
 */
router.get('/user/preferences', async (req, res) => {
  try {
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user's preferences
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const user = await dbAgent.users.getUserPreferences(userId);
    await dbAgent.close();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      preferences: {
        avatar_id: user.last_avatar_id,
        llm_id: user.last_llm_id || 'claude-3-5-sonnet',
        client_id: user.last_client_id
      }
    });
    
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({ 
      error: 'Failed to get user preferences',
      message: error.message 
    });
  }
});

export default router;