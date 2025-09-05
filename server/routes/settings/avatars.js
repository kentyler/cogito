/**
 * Avatar Settings Routes - DEPRECATED
 * Avatar system has been removed - these routes return empty responses for compatibility
 */

import express from 'express';

const router = express.Router();

/**
 * Get available avatars for a client (DEPRECATED - returns empty list)
 */
router.get('/clients/:clientId/avatars', async (req, res) => {
  try {
    // Avatar system removed - return empty list for compatibility
    res.json({
      success: true,
      avatars: [],
      message: 'Avatar system has been deprecated'
    });
    
  } catch (error) {
    console.error('Error in deprecated avatar endpoint:', error);
    res.status(500).json({ 
      error: 'Avatar system deprecated',
      message: 'Avatar functionality has been removed' 
    });
  }
});

/**
 * Update user's avatar preference (DEPRECATED - returns success but does nothing)
 */
router.post('/user/avatar-preference', async (req, res) => {
  try {
    // Avatar system removed - return success for compatibility but don't update anything
    res.json({
      success: true,
      message: 'Avatar system has been deprecated - no changes made',
      deprecated: true
    });
    
  } catch (error) {
    console.error('Error in deprecated avatar preference endpoint:', error);
    res.status(500).json({ 
      error: 'Avatar system deprecated',
      message: 'Avatar functionality has been removed' 
    });
  }
});

export default router;