/**
 * LLM List Handler
 * Get available LLMs for user's client
 */

import { getAvailableLLMs } from '#server/conversations/llm-config.js';
import { ApiResponses } from '#server/api/api-responses.js';

export async function handleLLMList(req, res) {
  try {
    const userId = req.session?.user?.user_id;
    const clientId = req.session?.user?.client_id;
    
    if (!userId) {
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    if (!clientId) {
      return ApiResponses.error(res, 400, 'Client selection required');
    }
    
    const llms = await getAvailableLLMs(req.pool, clientId);
    
    res.json({
      success: true,
      llms: llms,
      client_id: clientId
    });
    
  } catch (error) {
    console.error('Error fetching available LLMs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available LLMs'
    });
  }
}