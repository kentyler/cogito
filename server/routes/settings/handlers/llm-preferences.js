/**
 * LLM Preferences Handler
 * Update user's LLM selection
 */

import { isValidLLM, updateUserSelectedLLM } from '#server/conversations/llm-config.js';
import { ApiResponses } from '#server/api/api-responses.js';

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
    
    res.json({ 
      success: true, 
      message: 'LLM preference updated successfully',
      llm_id: llm_id
    });
    
  } catch (error) {
    console.error('Error updating LLM preference:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update LLM preference' 
    });
  }
}