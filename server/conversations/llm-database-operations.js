/**
 * LLM Database Operations - Refactored for file size compliance
 * Works with the existing client_mgmt.llms table to manage site-wide API keys
 * 
 * Available methods verified: getAllLLMs, getLLMByProvider, getLLMByModel, 
 * getAvailableModels, siteHasProvider, createSiteLLM, updateSiteLLM, 
 * deleteSiteLLM, updateUserSelectedLLM exist in dbAgent.llms
 */

import { withDbAgent } from './lib/db-wrapper.js';

export async function getAllLLMs(pool) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.getAllLLMs();
  }, []);
}

/**
 * Get LLM configuration by provider
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.provider - Provider name (e.g., 'anthropic', 'openai')
 * @returns {Promise<Object|null>} LLM configuration or null
 */
export async function getLLMByProvider({ pool, provider }) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.getLLMByProvider(provider);
  });
}

/**
 * Get LLM configuration by model ID
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.modelId - Model ID to look up
 * @returns {Promise<Object|null>} LLM configuration or null
 */
export async function getLLMByModel({ pool, modelId }) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.getLLMByModel(modelId);
  });
}

export async function getAvailableModels(pool) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.getAvailableModels();
  }, []);
}

/**
 * Check if site has a specific provider configured
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {string} options.provider - Provider name to check
 * @returns {Promise<boolean>} True if provider exists
 */
export async function siteHasProvider({ pool, provider }) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.siteHasProvider(provider);
  }, false);
}

/**
 * Create a new site-wide LLM configuration
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {Object} options.llmData - LLM configuration data
 * @returns {Promise<Object|null>} Created LLM or null
 */
export async function createSiteLLM({ pool, llmData }) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.createSiteLLM(llmData);
  });
}

/**
 * Update an existing site-wide LLM configuration
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {number} options.llmId - LLM ID to update
 * @param {Object} options.updates - Updates to apply
 * @returns {Promise<Object|null>} Updated LLM or null
 */
export async function updateSiteLLM({ pool, llmId, updates }) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.updateSiteLLM(llmId, updates);
  });
}

/**
 * Delete a site-wide LLM configuration
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {number} options.llmId - LLM ID to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteSiteLLM({ pool, llmId }) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.deleteSiteLLM(llmId);
  }, false);
}

/**
 * Update user's selected LLM
 * @param {Object} options
 * @param {Object} options.pool - Database connection pool
 * @param {number} options.userId - User ID
 * @param {number} options.llmId - LLM ID to select
 * @returns {Promise<Object|null>} Updated user preferences or null
 */
export async function updateUserSelectedLLM({ pool, userId, llmId }) {
  return withDbAgent(async (dbAgent) => {
    return await dbAgent.llms.updateUserSelectedLLM(userId, llmId);
  });
}