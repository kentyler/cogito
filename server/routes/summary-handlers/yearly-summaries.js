/**
 * Yearly Summaries Handler
 * Generate yearly summaries for a given year
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';

export async function handleYearlyGeneration(req, res) {
  const db = new DatabaseAgent();
  
  try {
    const { year } = req.body;
    
    if (!year) {
      return ApiResponses.badRequest(res, 'Year is required');
    }
    
    const { user_id, client_id, client_name } = db.summaries.getUserContext(req);
    
    if (!user_id || !client_id) {
      return ApiResponses.unauthorized(res, 'User authentication and client required');
    }
    
    await db.connect();
    
    const result = await db.summaries.generateYearlySummaries(
      parseInt(year),
      client_id,
      client_name,
      req.anthropic
    );
    
    return ApiResponses.success(res, {
      message: 'Yearly summaries generated successfully',
      summaries_created: Object.keys(result.summaries).length,
      year,
      client_name,
      summaries: result.summaries
    });
    
  } catch (error) {
    console.error('Error generating yearly summaries:', error);
    return ApiResponses.internalError(res, `Failed to generate yearly summaries: ${error.message}`);
  } finally {
    await db.close();
  }
}