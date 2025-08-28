/**
 * LLM Provider Configuration
 * Initializes different LLM provider clients based on database-stored API keys
 */

import { getAllLLMs } from '#server/conversations/llm-database-operations.js';
import { DatabaseProviderLoader } from './database-provider-loader.js';
import { EnvironmentFallback } from './environment-fallback.js';

/**
 * Initialize all available LLM providers from database
 */
export async function initializeLLMProviders(pool) {
  try {
    const llmConfigs = await getAllLLMs(pool);
    
    let providers;
    if (llmConfigs.length === 0) {
      console.log('⚠️ No LLM configurations found in database - falling back to environment variables');
      providers = EnvironmentFallback.initializeFromEnvironment();
    } else {
      providers = DatabaseProviderLoader.initializeFromDatabase(llmConfigs);
    }
    
    console.log(`🤖 LLM Providers initialized: ${Object.keys(providers).join(', ') || 'none'}`);
    return providers;
    
  } catch (error) {
    console.error('❌ Error initializing LLM providers from database:', error);
    console.log('⚠️ Falling back to environment variables');
    return EnvironmentFallback.initializeFromEnvironment();
  }
}