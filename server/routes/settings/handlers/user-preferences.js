/**
 * User Preferences Handler
 * Get user's current preferences
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';
import { EventLogger, extractRequestContext } from '#server/events/event-logger.js';

export async function handleUserPreferences(req, res) {
  try {
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    const preferences = await dbAgent.users.getUserPreferences(userId);
    
    await dbAgent.close();
    
    return ApiResponses.success(res, {
      success: true,
      preferences: preferences || {},
      user_id: userId
    });
    
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    
    // Log error as event to database
    const eventLogger = new EventLogger(req.pool);
    const context = extractRequestContext(req);
    await eventLogger.logError('user_preferences_fetch_error', error, context);
    
    return ApiResponses.internalError(res, 'Failed to fetch user preferences');
  }
}