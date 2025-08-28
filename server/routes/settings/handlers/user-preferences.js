/**
 * User Preferences Handler
 * Get user's current preferences
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';

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
    
    res.json({
      success: true,
      preferences: preferences || {},
      user_id: userId
    });
    
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences'
    });
  }
}