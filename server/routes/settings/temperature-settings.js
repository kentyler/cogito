/**
 * Temperature Settings API routes for client configuration
 */
import express from 'express';
import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';
import { EventLogger, extractRequestContext } from '#server/events/event-logger.js';

const router = express.Router();

/**
 * Get user temperature setting
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
      
      // Get user's temperature preference
      const user = await dbAgent.users.getUserById(userId);
      const temperature = user?.last_temperature || 0.7;
      
      return ApiResponses.success(res, {
        success: true,
        setting: {
          setting_key: 'temperature',
          setting_value: temperature.toString(),
          setting_type: 'number',
          parsed_value: temperature
        }
      });
    } finally {
      await dbAgent.close();
    }
    
  } catch (error) {
    console.error('Error getting user temperature:', error);
    
    // Log error as event to database
    const eventLogger = new EventLogger(req.pool);
    const context = extractRequestContext(req);
    await eventLogger.logError('user_temperature_get_error', error, context);
    
    return ApiResponses.internalError(res, 'Failed to get temperature setting');
  }
});

/**
 * Update user temperature setting
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
        const user = await dbAgent.users.getUserById(userId);
        previousTemperature = user?.last_temperature || 0.7;
      } catch (error) {
        console.warn('Could not fetch previous temperature for logging:', error);
      }
      
      // Update user's temperature preference
      const updated = await dbAgent.users.updateUserTemperature(userId, tempValue);
      
      // Log temperature change
      try {
        await dbAgent.logEvent('user_temperature_changed', {
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
      
      return ApiResponses.success(res, {
        success: true,
        message: 'Temperature setting updated',
        setting: {
          setting_key: 'temperature',
          setting_value: tempValue.toString(),
          setting_type: 'number',
          parsed_value: tempValue
        }
      });
    } finally {
      await dbAgent.close();
    }
    
  } catch (error) {
    console.error('Error updating user temperature:', error);
    
    // Log error as event to database
    const eventLogger = new EventLogger(req.pool);
    const context = extractRequestContext(req);
    await eventLogger.logError('user_temperature_update_error', error, context);
    
    return ApiResponses.internalError(res, 'Failed to update temperature setting');
  }
});

export default router;