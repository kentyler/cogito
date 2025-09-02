/**
 * Avatar System - LLM Voice Modulation
 * 
 * Database-driven avatar system that allows clients to choose different AI voices.
 * Avatars define how the LLM should speak and respond, not different entities.
 */

import { 
  selectAvatar as dbSelectAvatar, 
  processAvatarTemplate, 
  getAvatarMetadata,
  getClientAvatars,
  getDefaultAvatar,
  getAvatarById
} from './avatar-operations/index.js';

/**
 * Select appropriate avatar based on context (database-driven)
 * @param {Object} options
 * @param {Object} options.databasePool - Database connection pool
 * @param {string} options.clientId - Client ID to select avatar for
 * @param {string} options.userId - User ID for avatar preferences
 * @param {string} options.avatarId - Specific avatar ID to select (optional)
 * @param {string} options.selectionContext - Context for avatar selection (default: 'general')
 * @returns {Promise<Object>} Selected avatar object
 */
export async function selectAvatar({ databasePool, clientId, userId, avatarId, selectionContext = 'general' }) {
  return await dbSelectAvatar({ databasePool, clientId, userId, avatarId, selectionContext });
}

/**
 * Load avatar configuration from database
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.avatarId - Avatar ID to load
 * @param {string} options.clientId - Client ID for fallback default avatar
 * @returns {Promise<Object>} Avatar configuration object
 */
export async function loadAvatar({ pool, avatarId, clientId }) {
  if (avatarId) {
    const avatar = await getAvatarById({ pool, avatarId });
    if (avatar) return avatar;
  }
  
  // Fallback to default avatar for client
  return await getDefaultAvatar({ pool, clientId });
}

// Re-export functions from avatar-operations for convenience
export { 
  processAvatarTemplate, 
  getAvatarMetadata,
  getClientAvatars,
  getDefaultAvatar,
  getAvatarById 
} from './avatar-operations/index.js';