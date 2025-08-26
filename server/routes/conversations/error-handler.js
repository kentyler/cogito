/**
 * Conversation Error Handler
 * Handles errors and logging for conversation endpoints
 */

import { DatabaseAgent } from '../../lib/database-agent.js';

export async function handleConversationError(error, req, res) {
  console.error('Conversational REPL error:', error);
  
  // Log error to database using centralized logging
  try {
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    await dbAgent.logError('conversation_error', error, {
      userId: req.session?.user?.user_id || req.session?.user?.id,
      sessionId: req.sessionID,
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'error',
      component: 'Conversations'
    });
    await dbAgent.close();
  } catch (logError) {
    console.error('Failed to log conversation error:', logError);
  }
  
  // Return EDN-formatted error for frontend parser
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || 'Internal server error';
  const ednError = `{:response-type :error :content "${errorMessage}"}`;
  
  return res.status(statusCode).send(ednError);
}