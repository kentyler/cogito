/**
 * LLM Extended Operations - Site-wide LLM configuration management
 * Handles creation, updates, and deletion of LLM configurations
 */

export class LLMOperationsExtended {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Check if there's a valid API key for a provider (site-wide)
   * @param {string} provider - Provider name
   * @returns {boolean} Whether provider has valid key
   */
  async siteHasProvider(provider) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM client_mgmt.llms
        WHERE provider = $1
        AND api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
      `;
      const result = await this.connector.query(query, [provider]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking site provider:', error);
      return false;
    }
  }

  /**
   * Create a new site-wide LLM configuration
   * @param {Object} llmData - LLM configuration data
   * @returns {Object} Created LLM configuration
   */
  async createSiteLLM(llmData) {
    const { name, provider, model, apiKey, temperature = 0.7, maxTokens = 4000, additionalConfig = null } = llmData;
    
    try {
      const query = `
        INSERT INTO client_mgmt.llms (name, provider, model, api_key, temperature, max_tokens, additional_config)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await this.connector.query(query, 
        [name, provider, model, apiKey, temperature, maxTokens, additionalConfig]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating site LLM:', error);
      throw error;
    }
  }

  /**
   * Update an existing site-wide LLM configuration
   * @param {number} llmId - LLM ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated LLM configuration
   */
  async updateSiteLLM(llmId, updates) {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });
      
      if (setClause.length === 0) {
        throw new Error('No valid updates provided');
      }
      
      setClause.push(`updated_at = NOW()`);
      values.push(llmId);
      
      const query = `
        UPDATE client_mgmt.llms 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      const result = await this.connector.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating site LLM:', error);
      throw error;
    }
  }

  /**
   * Delete a site-wide LLM configuration
   * @param {number} llmId - LLM ID
   * @returns {Object} Deleted LLM configuration
   */
  async deleteSiteLLM(llmId) {
    try {
      const query = `
        DELETE FROM client_mgmt.llms 
        WHERE id = $1
        RETURNING *
      `;
      const result = await this.connector.query(query, [llmId]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting site LLM:', error);
      throw error;
    }
  }

  /**
   * Check if an LLM ID is valid
   * @param {string} llmId - LLM/Model ID to check
   * @returns {boolean} Whether the LLM ID is valid
   */
  async isValidLLM(llmId) {
    try {
      // First check if it's a model ID
      const modelQuery = `
        SELECT COUNT(*) as count
        FROM client_mgmt.llm_models
        WHERE model_id = $1 AND is_active = true
      `;
      const modelResult = await this.connector.query(modelQuery, [llmId]);
      
      if (parseInt(modelResult.rows[0].count) > 0) {
        return true;
      }
      
      // Check if it's a provider name
      const providerQuery = `
        SELECT COUNT(*) as count
        FROM client_mgmt.llms
        WHERE provider = $1
        AND api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
      `;
      const providerResult = await this.connector.query(providerQuery, [llmId]);
      
      return parseInt(providerResult.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking LLM validity:', error);
      return false;
    }
  }

  /**
   * Update user's selected LLM
   * @param {number} userId - User ID
   * @param {string} llmId - LLM/Model ID
   * @returns {Object} Updated user record
   */
  async updateUserSelectedLLM(userId, llmId) {
    try {
      const query = `
        UPDATE client_mgmt.users
        SET last_llm_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING last_llm_id, updated_at
      `;
      const result = await this.connector.query(query, [llmId, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user LLM selection:', error);
      throw error;
    }
  }
}