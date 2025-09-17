/**
 * LLM Provider Configuration
 * Initializes different LLM provider clients based on database-stored API keys
 */

import { getAllLLMs } from '#server/conversations/llm-database-operations.js';
import { DatabaseProviderLoader } from './database-provider-loader.js';
import { EnvironmentFallback } from './environment-fallback.js';

/**
 * Initialize all available LLM providers
 * Priority: Environment variables (secure) -> Database preferences (models/settings)
 */
export async function initializeLLMProviders(pool) {
  try {
    // ALWAYS initialize from environment variables first (secure API keys)
    const providers = EnvironmentFallback.initializeFromEnvironment();

    // Load model preferences and settings from database (not API keys)
    try {
      const llmConfigs = await getAllLLMs(pool);
      if (llmConfigs.length > 0) {
        console.log('📊 Loading LLM preferences from database (models, settings)');
        // Could enhance providers with database preferences here
        // but never override API keys from environment
      }
    } catch (dbError) {
      console.log('ℹ️ Could not load LLM preferences from database:', dbError.message);
    }

    console.log(`🤖 LLM Providers initialized: ${Object.keys(providers).join(', ') || 'none'}`);
    return providers;

  } catch (error) {
    console.error('❌ Error initializing LLM providers:', error);
    return {};
  }
}