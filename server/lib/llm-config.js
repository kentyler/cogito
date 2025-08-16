/**
 * LLM Configuration Management
 * Manages different LLM providers and their configurations
 */

// LLM configurations with provider details
const LLM_CONFIGS = {
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    description: 'Anthropic\'s latest high-performance model'
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    maxTokens: 4000,
    description: 'Fast and efficient model for quick responses'
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 4000,
    description: 'OpenAI\'s flagship model'
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    maxTokens: 4000,
    description: 'Fast and cost-effective OpenAI model'
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    model: 'gpt-4o',
    maxTokens: 4000,
    description: 'OpenAI\'s latest multimodal model'
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    model: 'gpt-4-turbo',
    maxTokens: 4000,
    description: 'Faster version of GPT-4'
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    maxTokens: 4000,
    description: 'Anthropic\'s most capable model'
  },
  'gemini-pro': {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    model: 'gemini-pro',
    maxTokens: 4000,
    description: 'Google\'s flagship AI model'
  },
  'mistral-large': {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    model: 'mistral-large-latest',
    maxTokens: 4000,
    description: 'Mistral AI\'s most capable model'
  }
};

// Default LLM if none specified
const DEFAULT_LLM = 'claude-3-5-sonnet';

/**
 * Get LLM configuration by ID
 */
export function getLLMConfig(llmId) {
  if (!llmId) {
    return LLM_CONFIGS[DEFAULT_LLM];
  }
  
  const config = LLM_CONFIGS[llmId];
  if (!config) {
    console.warn(`Unknown LLM ID: ${llmId}, falling back to default`);
    return LLM_CONFIGS[DEFAULT_LLM];
  }
  
  return config;
}

/**
 * Get all available LLM configurations
 */
export function getAllLLMConfigs() {
  return Object.values(LLM_CONFIGS);
}

/**
 * Get available LLMs (site-wide from database)
 */
export async function getAvailableLLMs(pool, clientId = null, userId = null) {
  // Import here to avoid circular dependency
  const { getAvailableModels } = await import('./llm-database-operations.js');
  
  try {
    // Get site-wide models from database
    const dbModels = await getAvailableModels(pool);
    
    if (dbModels.length === 0) {
      // Fall back to static configs if no database models
      return getAllLLMConfigs();
    }
    
    return dbModels;
  } catch (error) {
    console.error('Error getting available LLMs:', error);
    return getAllLLMConfigs();
  }
}

/**
 * Validate if an LLM ID is valid (checks both static configs and database)
 */
export async function isValidLLM(llmId, pool = null) {
  if (!llmId) return false;
  
  // Check static configs first
  if (LLM_CONFIGS.hasOwnProperty(llmId)) {
    return true;
  }
  
  // If pool is available, check database
  if (pool) {
    try {
      const { getLLMByModel } = await import('./llm-database-operations.js');
      const dbLLM = await getLLMByModel(pool, llmId);
      return !!dbLLM;
    } catch (error) {
      console.error('Error validating LLM against database:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Get user's selected LLM from database (with client-specific API keys)
 */
export async function getUserSelectedLLM(pool, userId, clientId = null) {
  try {
    if (!userId) {
      return getLLMConfig(DEFAULT_LLM);
    }
    
    // Get user's selected LLM and client
    const userResult = await pool.query(
      'SELECT last_llm_id, client_id FROM client_mgmt.users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return getLLMConfig(DEFAULT_LLM);
    }
    
    const user = userResult.rows[0];
    const userLLMId = user.last_llm_id;
    const userClientId = clientId || user.client_id;
    
    // If user has selected an LLM, try to get site-wide config from database
    if (userLLMId) {
      const { getLLMByModel } = await import('./llm-database-operations.js');
      const dbLLM = await getLLMByModel(pool, userLLMId);
      
      if (dbLLM) {
        // Return site-wide LLM config with actual API key
        return {
          id: dbLLM.model,
          name: dbLLM.name,
          provider: dbLLM.provider,
          model: dbLLM.model,
          maxTokens: dbLLM.max_tokens || 4000,
          temperature: dbLLM.temperature || 0.7,
          apiKey: dbLLM.api_key,
          description: `${dbLLM.name} via site-wide API key`,
          dbId: dbLLM.id
        };
      }
    }
    
    // Fall back to static config
    return getLLMConfig(userLLMId);
    
  } catch (error) {
    console.error('Error getting user selected LLM:', error);
    return getLLMConfig(DEFAULT_LLM);
  }
}

/**
 * Update user's selected LLM
 */
export async function updateUserSelectedLLM(pool, userId, llmId) {
  try {
    if (!(await isValidLLM(llmId, pool))) {
      throw new Error(`Invalid LLM ID: ${llmId}`);
    }
    
    const result = await pool.query(
      'UPDATE client_mgmt.users SET last_llm_id = $2 WHERE id = $1 RETURNING last_llm_id',
      [userId, llmId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating user selected LLM:', error);
    throw error;
  }
}