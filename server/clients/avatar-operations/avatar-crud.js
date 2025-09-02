/**
 * Avatar CRUD Operations - Basic database operations for avatars
 */

/**
 * Get specific avatar by ID
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.avatarId - Avatar ID to retrieve
 * @returns {Promise<Object|null>} Avatar object or null if not found
 */
export async function getAvatarById({ pool, avatarId }) {
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