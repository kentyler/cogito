/**
 * Daily Summary Handler  
 * Generate daily summary for a specific date
 */

import { DatabaseAgent } from '../../lib/database-agent.js';
import { ApiResponses } from '../../lib/api-responses.js';

export async function handleDailyGeneration(req, res) {
  const db = new DatabaseAgent();
  
  try {
    const { date } = req.body;
    
    if (!date) {
      return ApiResponses.badRequest(res, 'Date is required');
    }
    
    const { user_id, client_id, client_name } = db.summaries.getUserContext(req);
    
    await db.connect();
    
    const result = await db.summaries.generateDailySummary(
      date,
      client_id,
      client_name,
      req.anthropic
    );
    
    return ApiResponses.success(res, result);
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return ApiResponses.unauthorized(res, error.message);
    }
    console.error('Generate daily summary error:', error);
    return ApiResponses.internalError(res, 'Failed to generate daily summary');
  } finally {
    await db.close();
  }
}