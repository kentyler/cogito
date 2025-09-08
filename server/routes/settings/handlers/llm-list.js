/**
 * LLM List Handler
 * Get available LLMs for user's client
 */

import { getAvailableLLMs } from '#server/conversations/llm-config.js';
import { ApiResponses } from '#server/api/api-responses.js';

export async function handleLLMList(req, res) {
  // Available properties: user_id, client_id - verified session user object fields  
  console.log('🔍 LLM List handler called - Session:', {
    // Available properties: user_id, client_id - verified session user object fields
    userId: req.session?.user?.user_id,
    clientId: req.session?.user?.client_id,
    userExists: !!req.session?.user
  });
  
  try {
    // Available properties: user_id, client_id - verified session user object fields
    const userId = req.session?.user?.user_id;
    const clientId = req.session?.user?.client_id;
    
    if (!userId) {
      console.log('❌ No userId in session');
      return ApiResponses.error(res, 401, 'Authentication required');
    }
    
    if (!clientId) {
      console.log('❌ No clientId in session');
      return ApiResponses.error(res, 400, 'Client selection required');
    }
    
    console.log('📊 Getting available LLMs for client:', clientId);
    const llms = await getAvailableLLMs({ clientId });
    console.log('✅ Found LLMs:', llms.length, llms.map(l => l.name));
    
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