/**
 * Avatar Selection Operations - User and context-based avatar selection
 */

import { getClientAvatars, getDefaultAvatar } from './avatar-client.js';

/**
 * Get user's last used avatar
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.userId - User ID
 * @returns {Promise<Object|null>} User's last used avatar or null
 */
export async function getUserLastAvatar({ pool, userId }) {
  try {
    const result = await pool.query(`
      SELECT a.id, a.name, a.description, a.voice_template, a.response_style
      FROM client_mgmt.avatars a
      JOIN client_mgmt.users u ON a.id = u.last_avatar_id
      WHERE u.id = $1 AND a.is_active = true
    `, [userId]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting user last avatar:', error);
    return null;
  }
}

/**
 * Update user's last used avatar
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.userId - User ID
 * @param {string} options.avatarId - Avatar ID to set as last used
 * @returns {Promise<Object>} Updated user record
 */
export async function updateUserLastAvatar({ pool, userId, avatarId }) {
  try {
    const result = await pool.query(`
      UPDATE client_mgmt.users 
      SET last_avatar_id = $2
      WHERE id = $1
      RETURNING id, last_avatar_id
    `, [userId, avatarId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user last avatar:', error);
    throw error;
  }
}

/**
 * Select appropriate avatar based on context
 */
export async function selectAvatar(pool, { clientId, userId, avatarId, context = 'general' }) {
  // If specific avatar requested, try to get it (if client has access)
  if (avatarId) {
    const clientAvatars = await getClientAvatars({ pool, clientId });
    const requestedAvatar = clientAvatars.find(a => a.id === avatarId);
    if (requestedAvatar) {
      return requestedAvatar;
    }
  }
  
  // Check user's last used avatar
  if (userId) {
    const userLastAvatar = await getUserLastAvatar({ pool, userId });
    if (userLastAvatar) {
      // Verify user's last avatar is available to this client
      const clientAvatars = await getClientAvatars({ pool, clientId });
      const hasAccess = clientAvatars.find(a => a.id === userLastAvatar.id);
      if (hasAccess) {
        return userLastAvatar;
      }
    }
  }
  
  // Fall back to client default
  return await getDefaultAvatar({ pool, clientId });
}