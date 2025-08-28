/**
 * Environment Fallback - Handles fallback to environment variables
 */

import { ProviderInitializers } from './provider-initializers.js';

export class EnvironmentFallback {
  /**
   * Initialize providers from environment variables
   */
  static initializeFromEnvironment() {
    const providers = {};

    // Try Anthropic from environment
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (anthropicKey) {
      providers.anthropic = ProviderInitializers.initializeAnthropic(anthropicKey, 'environment');
    }

    // Try OpenAI from environment
    if (process.env.OPENAI_API_KEY) {
      providers.openai = ProviderInitializers.initializeOpenAI(process.env.OPENAI_API_KEY, 'environment');
    }

    return providers;
  }
}