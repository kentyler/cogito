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
 */
export async function selectAvatar(pool, { clientId, userId, avatarId, context = 'general' }) {
  return await dbSelectAvatar(pool, { clientId, userId, avatarId, context });
}

/**
 * Load avatar configuration from database
 */
export async function loadAvatar(pool, avatarId, clientId) {
  if (avatarId) {
    const avatar = await getAvatarById(pool, avatarId);
    if (avatar) return avatar;
  }
  
  // Fallback to default avatar for client
  return await getDefaultAvatar(pool, clientId);
}

// Re-export functions from avatar-operations for convenience
export { 
  processAvatarTemplate, 
  getAvatarMetadata,
  getClientAvatars,
  getDefaultAvatar,
  getAvatarById 
} from './avatar-operations/index.js';