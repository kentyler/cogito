/**
 * Turn Orchestrator
 * Main conversation turn processing workflow
 */

import { validateAndGetUserId, validateContent } from '#server/conversations/session-validator.js';
import { createUserTurn, createLLMTurn } from '#server/conversations/turn-handler.js';
import { generateLLMResponse } from '#server/conversations/llm-handler.js';
import { buildConversationContext } from '#server/conversations/conversation-context.js';
import { gameStateAgent } from '#ai-agents/game-state-agent.js';
import { resolveMeetingId } from './meeting-manager.js';
import { resolveClientInfo } from './client-resolver.js';

export async function processConversationalTurn(req, { content, context, meeting_id }) {
  console.log('🔍 STEP 1: Starting turn processing');
  
  // Validate user authentication
  const user_id = await validateAndGetUserId(req);
  if (!user_id) {
    throw new AuthError('Authentication required');
  }
  
  // Validate content
  if (!await validateContent(content)) {
    throw new ValidationError('Content is required');
  }

  // Handle meeting_id - create lazily if needed
  const effectiveMeetingId = await resolveMeetingId(req, meeting_id);
  console.log('🔍 STEP 4: Resolved meeting ID:', effectiveMeetingId);
  
  // Create user turn
  const userTurn = await createUserTurn(req, {
    userId: user_id,
    content: content,
    meetingId: effectiveMeetingId
  });
  
  // Get client info from meeting
  const { clientId, clientName } = await resolveClientInfo({ 
    req, 
    meetingId: effectiveMeetingId, 
    userId: user_id 
  });
  
  // Build conversation context
  console.log('🔍 STEP 7: Building conversation context');
  const contextResult = await buildConversationContext({ req, userTurn, clientId });
  const conversationContext = contextResult.context || contextResult;
  const sources = contextResult.sources || [];
  
  // Check game state
  console.log('🔍 STEP 8: Checking game state');
  const gameStateResult = await gameStateAgent.processTurn(req.sessionID, content, clientId);
  
  // Generate LLM response and get avatar info
  const llmResponseResult = await generateLLMResponse(req, {
    clientName,
    conversationContext,
    content,
    context,
    gameState: gameStateResult,
    clientId,
    userId: user_id
  });
  
  // Handle avatar selection and updates
  const { selectAvatar, updateUserLastAvatar } = await import('../../lib/avatar-operations/index.js');
  const usedAvatar = await selectAvatar(req.pool, { 
    clientId, 
    userId: user_id, 
    context: 'general' 
  });
  
  // Update user's last used avatar
  if (user_id && usedAvatar) {
    await updateUserLastAvatar({ pool: req.pool, userId: user_id, avatarId: usedAvatar.id });
  }
  
  // Create LLM turn
  const llmTurn = await createLLMTurn(req, {
    userId: user_id,
    llmResponse: llmResponseResult,
    userTurn,
    meetingId: effectiveMeetingId,
    avatarId: usedAvatar.id
  });
  
  return {
    id: llmTurn.id,
    user_turn_id: userTurn.id,
    prompt: content,
    response: llmResponseResult,
    sources: sources,
    created_at: llmTurn.created_at
  };
}

// Custom error classes for better error handling
class AuthError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}