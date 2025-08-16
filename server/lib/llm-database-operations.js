/**
 * LLM Database Operations
 * Works with the existing client_mgmt.llms table to manage site-wide API keys
 */

/**
 * Get all available LLM configurations (site-wide)
 */
export async function getAllLLMs(pool) {
  try {
    const result = await pool.query(`
      SELECT id, provider, api_key, type_id, additional_config
      FROM client_mgmt.llms
      WHERE api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
      ORDER BY provider
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting LLMs:', error);
    return [];
  }
}

/**
 * Get LLM configuration by provider (site-wide)
 */
export async function getLLMByProvider(pool, provider) {
  try {
    const result = await pool.query(`
      SELECT id, provider, api_key, type_id, additional_config
      FROM client_mgmt.llms
      WHERE provider = $1 
      AND api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
      LIMIT 1
    `, [provider]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting LLM by provider:', error);
    return null;
  }
}

/**
 * Get specific model configuration by model_id (site-wide)
 */
export async function getLLMByModel(pool, modelId) {
  try {
    const result = await pool.query(`
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
    `, [modelId]);
    
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
 * Get available models (site-wide) from new llm_models table
 */
export async function getAvailableModels(pool) {
  try {
    const result = await pool.query(`
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
    `);
    
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

/**
 * Create a new site-wide LLM configuration
 */
export async function createSiteLLM(pool, { name, provider, model, apiKey, temperature = 0.7, maxTokens = 4000, additionalConfig = null }) {
  try {
    const result = await pool.query(`
      INSERT INTO client_mgmt.llms (name, provider, model, api_key, temperature, max_tokens, additional_config)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, provider, model, apiKey, temperature, maxTokens, additionalConfig]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating site LLM:', error);
    throw error;
  }
}

/**
 * Update an existing site-wide LLM configuration
 */
export async function updateSiteLLM(pool, llmId, updates) {
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
    
    const result = await pool.query(`
      UPDATE client_mgmt.llms 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating site LLM:', error);
    throw error;
  }
}

/**
 * Delete a site-wide LLM configuration
 */
export async function deleteSiteLLM(pool, llmId) {
  try {
    const result = await pool.query(`
      DELETE FROM client_mgmt.llms 
      WHERE id = $1
      RETURNING *
    `, [llmId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting site LLM:', error);
    throw error;
  }
}

/**
 * Check if there's a valid API key for a provider (site-wide)
 */
export async function siteHasProvider(pool, provider) {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM client_mgmt.llms
      WHERE provider = $1
      AND api_key NOT IN ('YOUR_ANTHROPIC_API_KEY', 'YOUR_OPENAI_API_KEY')
    `, [provider]);
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error checking site provider:', error);
    return false;
  }
}