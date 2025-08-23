/**
 * Temperature Settings API routes for client configuration
 */
import express from 'express';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

/**
 * Get client temperature setting
 */
router.get('/clients/:clientId/settings/temperature', async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    try {
      // Verify user has access to this client using DatabaseAgent
      const hasAccess = await dbAgent.clients.checkUserClientAccess(userId, parseInt(clientId));
      
      if (!hasAccess) {
        return ApiResponses.error(res, 403, 'Access denied to client');
      }
      
      const setting = await dbAgent.clientSettings.getClientSetting(parseInt(clientId), 'temperature');
      
      res.json({
        success: true,
        setting: setting
      });
    } finally {
      await dbAgent.close();
    }
    
  } catch (error) {
    console.error('Error getting client temperature:', error);
    res.status(500).json({ 
      error: 'Failed to get temperature setting',
      message: error.message 
    });
  }
});

/**
 * Update client temperature setting
 */
router.post('/clients/:clientId/settings/temperature', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { temperature } = req.body;
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    if (temperature === undefined || temperature === null) {
      return ApiResponses.error(res, 400, 'Temperature value is required');
    }
    
    const tempValue = parseFloat(temperature);
    if (isNaN(tempValue) || tempValue < 0 || tempValue > 1) {
      return ApiResponses.error(res, 400, 'Temperature must be a number between 0 and 1');
    }
    
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    try {
      // Verify user has access to this client using DatabaseAgent
      const hasAccess = await dbAgent.clients.checkUserClientAccess(userId, parseInt(clientId));
      
      if (!hasAccess) {
        return ApiResponses.error(res, 403, 'Access denied to client');
      }
      // Get previous temperature for logging
      let previousTemperature = null;
      try {
        const previousSetting = await dbAgent.clientSettings.getClientSetting(parseInt(clientId), 'temperature');
        if (previousSetting) {
          previousTemperature = previousSetting.parsed_value;
        }
      } catch (error) {
        console.warn('Could not fetch previous temperature for logging:', error);
      }
      
      const setting = await dbAgent.clientSettings.setClientTemperature(
        parseInt(clientId), 
        tempValue, 
        userId
      );
      
      // Log temperature change
      try {
        await dbAgent.logEvent('client_temperature_changed', {
          client_id: parseInt(clientId),
          user_id: userId,
          new_temperature: tempValue,
          previous_temperature: previousTemperature,
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
      } catch (logError) {
        console.error('Failed to log temperature change:', logError);
      }
      
      res.json({
        success: true,
        message: 'Temperature setting updated',
        setting: setting
      });
    } finally {
      await dbAgent.close();
    }
    
  } catch (error) {
    console.error('Error updating client temperature:', error);
    res.status(500).json({ 
      error: 'Failed to update temperature setting',
      message: error.message 
    });
  }
});

export default router;