/**
 * LLM Database Operations - Simplified version for file size compliance
 * Works with the existing client_mgmt.llms table to manage site-wide API keys
 */

import { DatabaseAgent } from '#database/database-agent.js';

export async function getAllLLMs(pool) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const llms = await dbAgent.llms.getAllLLMs();
    await dbAgent.close();
    return llms;
  } catch (error) {
    console.error('Error getting LLMs:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    return [];
  }
}

/**
 * Get LLM configuration by provider
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.provider - Provider name (e.g., 'anthropic', 'openai')
 * @returns {Promise<Object|null>} LLM configuration or null
 */
export async function getLLMByProvider({ pool, provider }) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const llm = await dbAgent.llms.getLLMByProvider(provider);
    await dbAgent.close();
    return llm;
  } catch (error) {
    console.error('Error getting LLM by provider:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    return null;
  }
}

/**
 * Get LLM configuration by model ID
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.modelId - Model ID to look up
 * @returns {Promise<Object|null>} LLM model configuration or null
 */
export async function getLLMByModel({ pool, modelId }) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const llm = await dbAgent.llms.getLLMByModel(modelId);
    await dbAgent.close();
    return llm;
  } catch (error) {
    console.error('Error getting LLM by model:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    return null;
  }
}

export async function getAvailableModels(pool) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const models = await dbAgent.llms.getAvailableModels();
    await dbAgent.close();
    return models;
  } catch (error) {
    console.error('Error getting available models:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    return [];
  }
}

/**
 * Check if site has a configured provider
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.provider - Provider name to check
 * @returns {Promise<boolean>} True if provider is configured
 */
export async function siteHasProvider({ pool, provider }) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const llms = await dbAgent.llms.getLLMByProvider(provider);
    await dbAgent.close();
    return !!llms;
  } catch (error) {
    console.error('Error checking site provider:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    return false;
  }
}

/**
 * Create a new site-wide LLM configuration
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {Object} options.llmData - LLM configuration data
 * @returns {Promise<Object>} Created LLM record
 */
export async function createSiteLLM({ pool, llmData }) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const llm = await dbAgent.llms.createSiteLLM(llmData);
    await dbAgent.close();
    return llm;
  } catch (error) {
    console.error('Error creating site LLM:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    throw error;
  }
}

/**
 * Update site LLM configuration
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.llmId - LLM ID to update
 * @param {Object} options.updates - Fields to update
 * @returns {Promise<Object>} Updated LLM record
 */
export async function updateSiteLLM({ pool, llmId, updates }) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const llm = await dbAgent.llms.updateSiteLLM(llmId, updates);
    await dbAgent.close();
    return llm;
  } catch (error) {
    console.error('Error updating site LLM:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    throw error;
  }
}

/**
 * Delete a site-wide LLM configuration
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.llmId - LLM ID to delete
 * @returns {Promise<Object>} Deleted LLM record
 */
export async function deleteSiteLLM({ pool, llmId }) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const llm = await dbAgent.llms.deleteSiteLLM(llmId);
    await dbAgent.close();
    return llm;
  } catch (error) {
    console.error('Error deleting site LLM:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    throw error;
  }
}

/**
 * Update user's selected LLM
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.userId - User ID
 * @param {string} options.llmId - LLM ID to set as selected
 * @returns {Promise<Object>} Updated user record
 */
export async function updateUserSelectedLLM({ pool, userId, llmId }) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const result = await dbAgent.llms.updateUserSelectedLLM(userId, llmId);
    await dbAgent.close();
    return result;
  } catch (error) {
    console.error('Error updating user LLM selection:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    throw error;
  }
}
