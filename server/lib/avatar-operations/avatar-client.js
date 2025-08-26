/**
 * Avatar Client Operations - Client-specific avatar management
 */

import { getAvatarById } from './avatar-crud.js';

/**
 * Get available avatars for a client
 */
export async function getClientAvatars(pool, clientId) {
  try {
    const result = await pool.query(`
      SELECT a.id, a.name, a.description, a.voice_template, a.response_style, ca.is_default
      FROM client_mgmt.avatars a
      JOIN client_mgmt.client_avatars ca ON a.id = ca.avatar_id
      WHERE ca.client_id = $1 AND a.is_active = true
      ORDER BY ca.is_default DESC, a.name ASC
    `, [clientId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting client avatars:', error);
    return [];
  }
}

/**
 * Get default avatar for a client
 */
export async function getDefaultAvatar(pool, clientId) {
  try {
    const result = await pool.query(`
      SELECT a.id, a.name, a.description, a.voice_template, a.response_style
      FROM client_mgmt.avatars a
      JOIN client_mgmt.client_avatars ca ON a.id = ca.avatar_id
      WHERE ca.client_id = $1 AND ca.is_default = true AND a.is_active = true
      LIMIT 1
    `, [clientId]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Fallback to cogito_assistant if no default found
    return await getAvatarById(pool, 'cogito_assistant');
  } catch (error) {
    console.error('Error getting default avatar:', error);
    return await getAvatarById(pool, 'cogito_assistant');
  }
}

/**
 * Assign avatar to client
 */
export async function assignAvatarToClient(pool, clientId, avatarId, isDefault = false) {
  try {
    // If setting as default, unset other defaults for this client
    if (isDefault) {
      await pool.query(`
        UPDATE client_mgmt.client_avatars 
        SET is_default = false 
        WHERE client_id = $1
      `, [clientId]);
    }
    
    const result = await pool.query(`
      INSERT INTO client_mgmt.client_avatars (client_id, avatar_id, is_default)
      VALUES ($1, $2, $3)
      ON CONFLICT (client_id, avatar_id) 
      DO UPDATE SET is_default = $3
      RETURNING *
    `, [clientId, avatarId, isDefault]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error assigning avatar to client:', error);
    throw error;
  }
}