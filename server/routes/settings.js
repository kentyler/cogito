/**
 * Settings API routes for client, avatar, and LLM management
 */
import express from 'express';
import { getClientAvatars } from '../lib/avatar-operations.js';
import { updateUserLastAvatar } from '../lib/avatar-operations.js';
import { getAvailableLLMs, updateUserSelectedLLM, isValidLLM } from '../lib/llm-config.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

/**
 * Get available avatars for a client
 */
router.get('/clients/:clientId/avatars', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    if (!req.session?.user?.user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const avatars = await getClientAvatars(req.pool, parseInt(clientId));
    
    res.json({
      success: true,
      avatars: avatars
    });
    
  } catch (error) {
    console.error('Error getting client avatars:', error);
    res.status(500).json({ 
      error: 'Failed to get avatars',
      message: error.message 
    });
  }
});

/**
 * Update user's avatar preference
 */
router.post('/user/avatar-preference', async (req, res) => {
  try {
    const { avatar_id } = req.body;
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!avatar_id) {
      return res.status(400).json({ error: 'Avatar ID is required' });
    }
    
    // Get current avatar before updating (for logging)
    let previousAvatarId = null;
    try {
      const currentUserResult = await req.pool.query(
        'SELECT last_avatar_id FROM client_mgmt.users WHERE id = $1',
        [userId]
      );
      if (currentUserResult.rows.length > 0) {
        previousAvatarId = currentUserResult.rows[0].last_avatar_id;
      }
    } catch (error) {
      console.warn('Could not fetch previous avatar ID for logging:', error);
    }
    
    // Update user's last used avatar
    await updateUserLastAvatar(req.pool, userId, avatar_id);
    
    // Log avatar preference change
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logEvent('avatar_preference_changed', {
        user_id: userId,
        new_avatar_id: avatar_id,
        previous_avatar_id: previousAvatarId,
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
      console.error('Failed to log avatar preference change:', logError);
    }
    
    res.json({
      success: true,
      message: 'Avatar preference updated',
      avatar_id: avatar_id
    });
    
  } catch (error) {
    console.error('Error updating avatar preference:', error);
    res.status(500).json({ 
      error: 'Failed to update avatar preference',
      message: error.message 
    });
  }
});

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
      const currentUserResult = await req.pool.query(
        'SELECT last_llm_id FROM client_mgmt.users WHERE id = $1',
        [userId]
      );
      if (currentUserResult.rows.length > 0) {
        previousLlmId = currentUserResult.rows[0].last_llm_id;
      }
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
    const userResult = await req.pool.query(
      `SELECT uc.client_id, c.name as client_name
       FROM client_mgmt.user_clients uc
       JOIN client_mgmt.clients c ON c.id = uc.client_id
       WHERE uc.user_id = $1 AND uc.is_active = true
       LIMIT 1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or no active client' });
    }
    
    const clientId = userResult.rows[0].client_id;
    
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
    const userResult = await req.pool.query(`
      SELECT last_llm_id, last_client_id, last_avatar_id
      FROM client_mgmt.users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
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