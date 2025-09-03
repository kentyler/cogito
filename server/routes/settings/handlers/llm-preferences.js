/**
 * LLM Preferences Handler
 * Update user's LLM selection
 */

import { isValidLLM, updateUserSelectedLLM } from '#server/conversations/llm-config.js';
import { ApiResponses } from '#server/api/api-responses.js';
import { EventLogger, extractRequestContext } from '#server/events/event-logger.js';

export async function handleLLMPreferenceUpdate(req, res) {
  try {
    const { llm_id } = req.body;
    const userId = req.session?.user?.user_id;
    
    if (!userId) {
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    if (!llm_id) {
      return ApiResponses.error(res, 400, 'LLM ID is required');
    }
    
    if (!(await isValidLLM(llm_id, req.pool))) {
      return ApiResponses.error(res, 400, 'Invalid LLM ID');
    }
    
    await updateUserSelectedLLM(req.pool, userId, llm_id);
    
    return ApiResponses.success(res, { 
      success: true, 
      message: 'LLM preference updated successfully',
      llm_id: llm_id
    });
    
  } catch (error) {
    console.error('Error updating LLM preference:', error);
    
    // Log error as event to database
    const eventLogger = new EventLogger(req.pool);
    const context = extractRequestContext(req);
    await eventLogger.logError('llm_preference_update_error', error, context);
    
    return ApiResponses.internalError(res, 'Failed to update LLM preference');
  }
}