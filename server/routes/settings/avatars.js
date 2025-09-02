/**
 * Avatar Settings Routes - Avatar preference management
 * GET /clients/:clientId/avatars - Get available avatars for a client
 * POST /user/avatar-preference - Update user's avatar preference
 */

import express from 'express';
import { getClientAvatars, updateUserLastAvatar } from '#server/clients/avatar-operations/index.js';
import { DatabaseAgent } from '#database/database-agent.js';

const router = express.Router();

/**
 * Get available avatars for a client
 */
router.get('/clients/:clientId/avatars', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    if (!req.session?.user?.user_id) {
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    const avatars = await getClientAvatars({ pool: req.pool, clientId: parseInt(clientId) });
    
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
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    if (!avatar_id) {
      return ApiResponses.error(res, 400, 'Avatar ID is required');
    }
    
    // Get current avatar before updating (for logging)
    let previousAvatarId = null;
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      previousAvatarId = await dbAgent.users.getUserPreference(userId, 'last_avatar_id');
      await dbAgent.close();
    } catch (error) {
      console.warn('Could not fetch previous avatar ID for logging:', error);
    }
    
    // Update user's last used avatar
    await updateUserLastAvatar({ pool: req.pool, userId, avatarId: avatar_id });
    
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

export default router;