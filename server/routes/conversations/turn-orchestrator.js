/**
 * Turn Orchestrator
 * Main conversation turn processing workflow
 * @param {Object} options
 * @param {Object} options.expressRequest - Express request object with session, pool, etc.
 * @param {string} options.conversationContent - Content of the user's turn
 * @param {string} options.conversationContext - Additional context for the conversation
 * @param {string} options.meetingId - Meeting ID (optional, will be resolved if needed)
 * @returns {Promise<Object>} Turn processing result with response and metadata
 */

import { validateAndGetUserId, validateContent } from '#server/conversations/session-validator.js';
import { createUserTurn, createLLMTurn } from '#server/conversations/turn-handler.js';
import { generateLLMResponse } from '#server/conversations/llm-handler.js';
import { buildConversationContext } from '#server/conversations/conversation-context.js';
import { gameStateAgent } from '#ai-agents/game-state-agent.js';
import { resolveMeetingId } from './meeting-manager.js';
import { resolveClientInfo } from './client-resolver.js';

export async function processConversationalTurn({ expressRequest, conversationContent, conversationContext, meetingId }) {
  console.log('🔍 STEP 1: Starting turn processing');
  
  // Validate user authentication
  const user_id = await validateAndGetUserId(expressRequest);
  if (!user_id) {
    throw new AuthError('Authentication required');
  }
  
  // Validate content
  if (!await validateContent(conversationContent)) {
    throw new ValidationError('Content is required');
  }

  // Handle meeting_id - create lazily if needed
  const effectiveMeetingId = await resolveMeetingId(expressRequest, meetingId);
  console.log('🔍 STEP 4: Resolved meeting ID:', effectiveMeetingId);
  
  // Create user turn
  const userTurn = await createUserTurn(expressRequest, {
    userId: user_id,
    content: conversationContent,
    meetingId: effectiveMeetingId
  });
  
  // Get client info from meeting
  const { clientId, clientName } = await resolveClientInfo({ 
    expressRequest, 
    meetingId: effectiveMeetingId, 
    userId: user_id 
  });
  
  // Build conversation context
  console.log('🔍 STEP 7: Building conversation context');
  const contextResult = await buildConversationContext({ expressRequest, userTurn, clientId });
  const builtContext = contextResult.context || contextResult;
  const sources = contextResult.sources || [];
  
  // Check game state
  console.log('🔍 STEP 8: Checking game state');
  const gameStateResult = await gameStateAgent.processTurn(expressRequest.sessionID, conversationContent, clientId);
  
  // Generate LLM response and get avatar info
  const llmResponseResult = await generateLLMResponse(expressRequest, {
    clientName,
    conversationContext: builtContext,
    content: conversationContent,
    context: builtContext,
    gameState: gameStateResult,
    clientId,
    userId: user_id
  });
  
  // Handle avatar selection and updates
  const { selectAvatar, updateUserLastAvatar } = await import('../../lib/avatar-operations/index.js');
  const usedAvatar = await selectAvatar({ 
    databasePool: expressRequest.pool,
    clientId, 
    userId: user_id, 
    selectionContext: 'general' 
  });
  
  // Update user's last used avatar
  if (user_id && usedAvatar) {
    await updateUserLastAvatar({ pool: expressRequest.pool, userId: user_id, avatarId: usedAvatar.id });
  }
  
  // Create LLM turn
  const llmTurn = await createLLMTurn(expressRequest, {
    userId: user_id,
    llmResponse: llmResponseResult,
    userTurn,
    meetingId: effectiveMeetingId,
    avatarId: usedAvatar.id
  });
  
  return {
    id: llmTurn.id,
    user_turn_id: userTurn.id,
    prompt: conversationContent,
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