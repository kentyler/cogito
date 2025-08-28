/**
 * LLM Operations - Business logic for LLM configuration management
 * Handles user preferences, database lookups, and configuration retrieval
 */

import { LLM_CONFIGS, DEFAULT_LLM } from './llm-configurations.js';

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
  const { getAvailableModels } = await import('./llm-database-operations.js');
  
  try {
    const dbModels = await getAvailableModels(pool);
    
    if (dbModels.length === 0) {
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
  
  if (LLM_CONFIGS.hasOwnProperty(llmId)) {
    return true;
  }
  
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
      const defaultConfig = getLLMConfig(DEFAULT_LLM);
      
      const { loadClientTemperature } = await import('./client-temperature-loader.js');
      const clientTemperature = await loadClientTemperature(clientId);
      if (clientTemperature !== null) {
        console.log(`🌡️ Using client temperature setting: ${clientTemperature} for client ${clientId} (no user)`);
        return {
          ...defaultConfig,
          temperature: clientTemperature
        };
      }
      
      return defaultConfig;
    }
    
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
    
    if (userLLMId) {
      const { getLLMByModel } = await import('./llm-database-operations.js');
      const dbLLM = await getLLMByModel(pool, userLLMId);
      
      if (dbLLM) {
        const { loadClientTemperature } = await import('./client-temperature-loader.js');
        const clientTemperature = await loadClientTemperature(userClientId) || dbLLM.temperature || 0.7;
        
        return {
          id: dbLLM.model,
          name: dbLLM.name,
          provider: dbLLM.provider,
          model: dbLLM.model,
          maxTokens: dbLLM.max_tokens || 4000,
          temperature: clientTemperature,
          apiKey: dbLLM.api_key,
          description: `${dbLLM.name} via site-wide API key`,
          dbId: dbLLM.id
        };
      }
    }
    
    const staticConfig = getLLMConfig(userLLMId);
    
    const { loadClientTemperature } = await import('./client-temperature-loader.js');
    const clientTemperature = await loadClientTemperature(userClientId);
    if (clientTemperature !== null) {
      console.log(`🌡️ Using client temperature setting: ${clientTemperature} for client ${userClientId} (static fallback)`);
      return {
        ...staticConfig,
        temperature: clientTemperature
      };
    }
    
    return staticConfig;
    
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