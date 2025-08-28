/**
 * Provider Initializers - Individual provider initialization logic
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export class ProviderInitializers {
  /**
   * Initialize Anthropic provider
   */
  static initializeAnthropic(apiKey, source = 'database') {
    const client = new Anthropic({ apiKey });
    console.log(`✅ Anthropic (Claude) provider initialized from ${source}`);
    return client;
  }

  /**
   * Initialize OpenAI provider
   */
  static initializeOpenAI(apiKey, source = 'database') {
    const client = new OpenAI({ apiKey });
    console.log(`✅ OpenAI provider initialized from ${source}`);
    return client;
  }

  /**
   * Handle providers not yet implemented
   */
  static handleNotImplemented(provider) {
    console.log(`ℹ️ ${provider} API key found in database but SDK not yet implemented`);
  }

  /**
   * Handle unknown provider
   */
  static handleUnknown(provider) {
    console.log(`ℹ️ Unknown provider: ${provider}`);
  }

  /**
   * Handle provider initialization error
   */
  static handleError(provider, error) {
    console.warn(`⚠️ Failed to initialize ${provider} provider:`, error.message);
  }
}