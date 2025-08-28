/**
 * Database Provider Loader - Loads providers from database configurations
 */

import { ProviderInitializers } from './provider-initializers.js';

export class DatabaseProviderLoader {
  /**
   * Initialize providers from database configurations
   */
  static initializeFromDatabase(llmConfigs) {
    const providers = {};

    for (const llmConfig of llmConfigs) {
      try {
        this.initializeProvider(providers, llmConfig);
      } catch (error) {
        ProviderInitializers.handleError(llmConfig.provider, error);
      }
    }

    return providers;
  }

  /**
   * Initialize a single provider from config
   */
  static initializeProvider(providers, llmConfig) {
    const { provider, api_key } = llmConfig;

    if (!api_key) return;

    switch (provider) {
      case 'anthropic':
        if (!providers.anthropic) {
          providers.anthropic = ProviderInitializers.initializeAnthropic(api_key);
        }
        break;

      case 'openai':
        if (!providers.openai) {
          providers.openai = ProviderInitializers.initializeOpenAI(api_key);
        }
        break;

      case 'google':
        ProviderInitializers.handleNotImplemented('Google');
        break;

      case 'mistral':
        ProviderInitializers.handleNotImplemented('Mistral');
        break;

      default:
        ProviderInitializers.handleUnknown(provider);
    }
  }
}