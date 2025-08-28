/**
 * Monthly Summaries Handler
 * Generate monthly summaries for a given year/month
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';

export async function handleMonthlyGeneration(req, res) {
  const db = new DatabaseAgent();
  
  try {
    const { year, month } = req.body;
    
    if (!year || month === undefined) {
      return ApiResponses.badRequest(res, 'Year and month are required');
    }
    
    const { user_id, client_id, client_name } = db.summaries.getUserContext(req);
    
    if (!user_id || !client_id) {
      return ApiResponses.unauthorized(res, 'User authentication and client required');
    }
    
    await db.connect();
    
    // Generate monthly summaries using DatabaseAgent
    const result = await db.summaries.generateMonthlySummariesForPeriod({
      year: parseInt(year),
      month: parseInt(month),
      client_id,
      user_id
    });
    
    return ApiResponses.success(res, {
      message: 'Monthly summaries generated successfully',
      summaries_created: result.summariesCreated || 0,
      period: `${year}-${month.toString().padStart(2, '0')}`,
      client_name
    });
    
  } catch (error) {
    console.error('Error generating monthly summaries:', error);
    return ApiResponses.internalError(res, `Failed to generate monthly summaries: ${error.message}`);
  } finally {
    await db.close();
  }
}