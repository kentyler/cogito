/**
 * Daily Summary Fetch Handler
 * Get daily summary for a specific date
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';

export async function handleDailyFetch(req, res) {
  const db = new DatabaseAgent();
  
  try {
    const { date } = req.params;
    
    if (!date) {
      return ApiResponses.badRequest(res, 'Date parameter is required');
    }
    
    const { user_id, client_id } = db.summaries.getUserContext(req);
    
    await db.connect();
    
    const summary = await db.summaries.getDailySummary(
      date,
      client_id
    );
    
    if (!summary) {
      return ApiResponses.notFound(res, 'Daily summary not found for this date');
    }
    
    return ApiResponses.success(res, summary);
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return ApiResponses.unauthorized(res, error.message);
    }
    console.error('Get daily summary error:', error);
    return ApiResponses.internalError(res, 'Failed to get daily summary');
  } finally {
    await db.close();
  }
}