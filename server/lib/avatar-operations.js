/**
 * Avatar Operations - Database-driven avatar management
 */

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
 * Get specific avatar by ID
 */
export async function getAvatarById(pool, avatarId) {
  try {
    const result = await pool.query(`
      SELECT id, name, description, voice_template, response_style
      FROM client_mgmt.avatars
      WHERE id = $1 AND is_active = true
    `, [avatarId]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Fallback to default assistant
    return {
      id: 'cogito_assistant',
      name: 'Cogito Assistant',
      voice_template: 'You are a helpful AI assistant.',
      response_style: { perspective: 'helpful_assistant', source_type: 'llm_response' }
    };
  } catch (error) {
    console.error('Error getting avatar by ID:', error);
    return null;
  }
}

/**
 * Get user's last used avatar
 */
export async function getUserLastAvatar(pool, userId) {
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
 * Select appropriate avatar based on context
 */
export async function selectAvatar(pool, { clientId, userId, avatarId, context = 'general' }) {
  // If specific avatar requested, try to get it (if client has access)
  if (avatarId) {
    const clientAvatars = await getClientAvatars(pool, clientId);
    const requestedAvatar = clientAvatars.find(a => a.id === avatarId);
    if (requestedAvatar) {
      return requestedAvatar;
    }
  }
  
  // Check user's last used avatar
  if (userId) {
    const userLastAvatar = await getUserLastAvatar(pool, userId);
    if (userLastAvatar) {
      // Verify user's last avatar is available to this client
      const clientAvatars = await getClientAvatars(pool, clientId);
      const hasAccess = clientAvatars.find(a => a.id === userLastAvatar.id);
      if (hasAccess) {
        return userLastAvatar;
      }
    }
  }
  
  // Fall back to client default
  return await getDefaultAvatar(pool, clientId);
}

/**
 * Process avatar template with variables
 */
export function processAvatarTemplate(avatar, variables = {}) {
  let processedTemplate = avatar.voice_template;
  
  // Replace template variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return processedTemplate;
}

/**
 * Get avatar metadata for turn tracking
 */
export function getAvatarMetadata(avatar) {
  const responseStyle = typeof avatar.response_style === 'string' 
    ? JSON.parse(avatar.response_style) 
    : avatar.response_style;
    
  return {
    avatar_id: avatar.id,
    voice_perspective: responseStyle?.perspective || 'assistant',
    source_type: responseStyle?.source_type || 'llm_response'
  };
}

/**
 * Create a new avatar (admin function)
 */
export async function createAvatar(pool, { id, name, description, voiceTemplate, responseStyle, createdBy }) {
  try {
    const result = await pool.query(`
      INSERT INTO client_mgmt.avatars (id, name, description, voice_template, response_style, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, name, description, voiceTemplate, JSON.stringify(responseStyle), createdBy]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating avatar:', error);
    throw error;
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

/**
 * Update user's last used avatar
 */
export async function updateUserLastAvatar(pool, userId, avatarId) {
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