/**
 * LLM Operations - Database operations for LLM management
 * Manages LLM configurations, models, and user preferences
 */

import { LLMOperationsExtended } from './llm-operations-extended.js';

export class LLMOperations {
  constructor(connector) {
    this.connector = connector;
    this._extended = new LLMOperationsExtended(connector);
  }

  /**
   * Get all available LLM configurations (site-wide)
   * @returns {Array} List of LLM configurations
   */
  async getAllLLMs() {
    try {
      const query = `
        SELECT id, provider, api_key, additional_config
        FROM client_mgmt.llms
        WHERE api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
        ORDER BY provider
      `;
      const result = await this.connector.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting LLMs:', error);
      return [];
    }
  }

  /**
   * Get LLM configuration by provider (site-wide)
   * @param {string} provider - Provider name (anthropic, openai, etc.)
   * @returns {Object|null} LLM configuration or null
   */
  async getLLMByProvider(provider) {
    try {
      const query = `
        SELECT id, provider, api_key, additional_config
        FROM client_mgmt.llms
        WHERE provider = $1 
        AND api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
        LIMIT 1
      `;
      const result = await this.connector.query(query, [provider]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting LLM by provider:', error);
      return null;
    }
  }

  /**
   * Get specific model configuration by model_id (site-wide)
   * @param {string} modelId - Model ID
   * @returns {Object|null} Model configuration or null
   */
  async getLLMByModel(modelId) {
    try {
      const query = `
        SELECT 
          m.id as model_db_id,
          m.name,
          m.model_id,
          m.max_tokens,
          m.temperature,
          m.input_cost_per_token,
          m.output_cost_per_token,
          m.supports_streaming,
          m.supports_images,
          m.supports_functions,
          m.description,
          l.provider,
          l.api_key,
          l.id as llm_id
        FROM client_mgmt.llm_models m
        JOIN client_mgmt.llms l ON m.llm_id = l.id
        WHERE m.model_id = $1
        AND m.is_active = true
        AND l.api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
        LIMIT 1
      `;
      const result = await this.connector.query(query, [modelId]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.model_id,
        name: row.name,
        provider: row.provider,
        model: row.model_id,
        maxTokens: row.max_tokens || 4000,
        temperature: row.temperature || 0.7,
        inputCostPerToken: parseFloat(row.input_cost_per_token),
        outputCostPerToken: parseFloat(row.output_cost_per_token),
        supportsStreaming: row.supports_streaming,
        supportsImages: row.supports_images,
        supportsFunctions: row.supports_functions,
        description: row.description,
        apiKey: row.api_key,
        llmId: row.llm_id,
        modelDbId: row.model_db_id
      };
    } catch (error) {
      console.error('Error getting LLM by model:', error);
      return null;
    }
  }

  /**
   * Get available models (site-wide) from llm_models table
   * @returns {Array} List of available models
   */
  async getAvailableModels() {
    try {
      const query = `
        SELECT 
          m.id as model_db_id,
          m.name,
          m.model_id,
          m.max_tokens,
          m.temperature,
          m.input_cost_per_token,
          m.output_cost_per_token,
          m.supports_streaming,
          m.supports_images,
          m.supports_functions,
          m.description,
          l.provider,
          l.api_key,
          l.id as llm_id
        FROM client_mgmt.llm_models m
        JOIN client_mgmt.llms l ON m.llm_id = l.id
        WHERE m.is_active = true
        AND l.api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
        ORDER BY l.provider, m.name
      `;
      const result = await this.connector.query(query);
      
      // Convert to our LLM config format
      return result.rows.map(row => ({
        id: row.model_id, // Use model_id as the ID
        name: row.name,
        provider: row.provider,
        model: row.model_id,
        maxTokens: row.max_tokens || 4000,
        temperature: row.temperature || 0.7,
        inputCostPerToken: parseFloat(row.input_cost_per_token),
        outputCostPerToken: parseFloat(row.output_cost_per_token),
        supportsStreaming: row.supports_streaming,
        supportsImages: row.supports_images,
        supportsFunctions: row.supports_functions,
        description: row.description || `${row.name} via site-wide API key`,
        hasValidKey: true,
        apiKey: row.api_key,
        llmId: row.llm_id,
        modelDbId: row.model_db_id
      }));
    } catch (error) {
      console.error('Error getting available models:', error);
      return [];
    }
  }

  // Extended operations delegation
  async isValidLLM(llmId) {
    return await this._extended.isValidLLM(llmId);
  }

  async siteHasProvider(provider) {
    return await this._extended.siteHasProvider(provider);
  }

  async createSiteLLM(llmData) {
    return await this._extended.createSiteLLM(llmData);
  }

  async updateSiteLLM(llmId, updates) {
    return await this._extended.updateSiteLLM(llmId, updates);
  }

  async deleteSiteLLM(llmId) {
    return await this._extended.deleteSiteLLM(llmId);
  }

  async updateUserSelectedLLM(userId, llmId) {
    return await this._extended.updateUserSelectedLLM(userId, llmId);
  }
}