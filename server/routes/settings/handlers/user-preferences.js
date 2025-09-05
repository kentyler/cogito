/**
 * User Preferences Handler
 * Get user's current preferences
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';
import { extractRequestContext } from '#server/events/event-logger.js';

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
    
    // Log error as event to database using DatabaseAgent
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      await dbAgent.logError('user_preferences_fetch_error', error, extractRequestContext(req));
      await dbAgent.close();
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return ApiResponses.internalError(res, 'Failed to fetch user preferences');
  }
}