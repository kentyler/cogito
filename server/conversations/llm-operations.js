/**
 * LLM Operations - Business logic for LLM configuration management
 * Handles user preferences, database lookups, and configuration retrieval
 */

import { LLM_CONFIGS, DEFAULT_LLM } from './llm-configurations.js';
import { DatabaseAgent } from '#database/database-agent.js';

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
 * @param {Object} options
 * @param {Object} [options.pool] - Database connection pool (deprecated, will use DatabaseAgent instead)
 * @param {string|null} [options.clientId=null] - Client ID for client-specific models
 * @param {string|null} [options.userId=null] - User ID for user preferences
 * @returns {Promise<Array<Object>>} Array of available LLM configurations
 */
export async function getAvailableLLMs({ pool = null, clientId = null, userId = null }) {
  const dbAgent = new DatabaseAgent();
  
  try {
    await dbAgent.connect();
    const dbModels = await dbAgent.llms.getAvailableModels();
    await dbAgent.close();
    
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
  
  const dbAgent = new DatabaseAgent();
  
  try {
    await dbAgent.connect();
    const dbLLM = await dbAgent.llms.getLLMByModel(llmId);
    await dbAgent.close();
    return !!dbLLM;
  } catch (error) {
    console.error('Error validating LLM against database:', error);
    return false;
  }
}

/**
 * Get user's selected LLM from database (with client-specific API keys)
 * @param {Object} options
 * @param {Object} [options.pool] - Database connection pool (deprecated, will use DatabaseAgent instead)
 * @param {string} options.userId - User ID
 * @param {string|null} [options.clientId=null] - Client ID for API key context
 * @returns {Promise<Object|null>} User's selected LLM configuration or null
 */
export async function getUserSelectedLLM({ pool = null, userId, clientId = null }) {
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
    
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    const userPrefs = await dbAgent.users.getUserPreferences(userId);
    
    if (!userPrefs) {
      await dbAgent.close();
      return getLLMConfig(DEFAULT_LLM);
    }
    
    const userLLMId = userPrefs.last_llm_id;
    const userClientId = clientId || userPrefs.last_client_id;
    
    if (userLLMId) {
      const dbLLM = await dbAgent.llms.getLLMByModel(userLLMId);
      
      if (dbLLM) {
        const { loadClientTemperature } = await import('./client-temperature-loader.js');
        const clientTemperature = await loadClientTemperature(userClientId) || dbLLM.temperature || 0.7;
        
        await dbAgent.close();
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
    
    await dbAgent.close();
    
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
  const dbAgent = new DatabaseAgent();
  
  try {
    if (!(await isValidLLM(llmId))) {
      throw new Error(`Invalid LLM ID: ${llmId}`);
    }
    
    await dbAgent.connect();
    const result = await dbAgent.users.updateUserPreference(userId, 'last_llm_id', llmId);
    await dbAgent.close();
    
    return { last_llm_id: llmId };
  } catch (error) {
    console.error('Error updating user selected LLM:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    throw error;
  }
}