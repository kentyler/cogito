/**
 * LLM Provider Configuration
 * Initializes different LLM provider clients based on database-stored API keys
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getAllLLMs } from '../lib/llm-database-operations.js';

/**
 * Initialize all available LLM providers from database
 */
export async function initializeLLMProviders(pool) {
  const providers = {};
  
  try {
    // Get all LLM configurations from database
    const llmConfigs = await getAllLLMs(pool);
    
    if (llmConfigs.length === 0) {
      console.log('⚠️ No LLM configurations found in database - falling back to environment variables');
      
      // Fallback to environment variables if database is empty
      if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) {
        providers.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
        });
        console.log('✅ Anthropic (Claude) provider initialized from environment');
      }
      
      if (process.env.OPENAI_API_KEY) {
        providers.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ OpenAI provider initialized from environment');
      }
    } else {
      // Initialize providers from database configurations
      for (const llmConfig of llmConfigs) {
        try {
          switch (llmConfig.provider) {
            case 'anthropic':
              if (!providers.anthropic && llmConfig.api_key) {
                providers.anthropic = new Anthropic({
                  apiKey: llmConfig.api_key
                });
                console.log('✅ Anthropic (Claude) provider initialized from database');
              }
              break;
              
            case 'openai':
              if (!providers.openai && llmConfig.api_key) {
                providers.openai = new OpenAI({
                  apiKey: llmConfig.api_key
                });
                console.log('✅ OpenAI provider initialized from database');
              }
              break;
              
            case 'google':
              if (llmConfig.api_key) {
                // Note: Google AI SDK would need to be installed
                // const { GoogleGenerativeAI } = require('@google/generative-ai');
                // providers.google = new GoogleGenerativeAI(llmConfig.api_key);
                console.log('ℹ️ Google API key found in database but SDK not yet implemented');
              }
              break;
              
            case 'mistral':
              if (llmConfig.api_key) {
                // Note: Mistral SDK would need to be installed
                // const MistralClient = require('@mistralai/mistralai');
                // providers.mistral = new MistralClient(llmConfig.api_key);
                console.log('ℹ️ Mistral API key found in database but SDK not yet implemented');
              }
              break;
              
            default:
              console.log(`ℹ️ Unknown provider: ${llmConfig.provider}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to initialize ${llmConfig.provider} provider:`, error.message);
        }
      }
    }
    
    console.log(`🤖 LLM Providers initialized: ${Object.keys(providers).join(', ') || 'none'}`);
    return providers;
    
  } catch (error) {
    console.error('❌ Error initializing LLM providers from database:', error);
    console.log('⚠️ Falling back to environment variables');
    
    // Fallback to environment variables on database error
    if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) {
      providers.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
      });
      console.log('✅ Anthropic (Claude) provider initialized from environment');
    }
    
    if (process.env.OPENAI_API_KEY) {
      providers.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI provider initialized from environment');
    }
    
    return providers;
  }
}