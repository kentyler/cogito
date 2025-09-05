/**
 * LLM interaction and response generation
 */
import { buildConversationalPrompt, processLLMResponse } from './llm-prompt-builder.js';
import { getUserSelectedLLM } from './llm-config.js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export async function generateLLMResponse(req, { 
  clientName, 
  conversationContext, 
  content, 
  context,
  gameState,
  clientId,
  userId = null
}) {
  try {
    // Check if this is a Golden Horde request (path-based or context-based)
    const isGoldenHorde = req.originalUrl?.includes('/goldenhorde/') ||
                          context === 'golden-horde-interface';
    
    let llmConfig;
    if (isGoldenHorde) {
      // Override to use Claude 3 Haiku for Golden Horde
      console.log('🔍 Golden Horde detected - forcing Claude 3 Haiku');
      llmConfig = {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        maxTokens: 4000,
        temperature: 0.7,
        apiKey: null // Will use global Anthropic key
      };
    } else {
      // Get user's selected LLM configuration with client-specific API keys
      llmConfig = await getUserSelectedLLM({ pool: req.pool, userId, clientId });
    }
    
    console.log('🔍 STEP 7.5: Using LLM:', llmConfig.name, '(' + llmConfig.id + ')');
    console.log('🔍 Has client-specific key:', !!llmConfig.apiKey);
    
    // Create provider client instances based on available API keys
    let anthropicClient, openaiClient, googleClient, mistralClient;
    
    // Use client-specific API key if available, otherwise fall back to global
    if (llmConfig.provider === 'anthropic') {
      if (llmConfig.apiKey) {
        anthropicClient = new Anthropic({ apiKey: llmConfig.apiKey });
      } else if (req.anthropic) {
        anthropicClient = req.anthropic;
      } else {
        return `{:response-type :text :content "Claude not available - no API key configured for this client"}`;
      }
    }
    
    if (llmConfig.provider === 'openai') {
      if (llmConfig.apiKey) {
        openaiClient = new OpenAI({ apiKey: llmConfig.apiKey });
      } else if (req.openai) {
        openaiClient = req.openai;
      } else {
        return `{:response-type :text :content "OpenAI not available - no API key configured for this client"}`;
      }
    }
    
    if (llmConfig.provider === 'google') {
      if (llmConfig.apiKey) {
        // TODO: Create Google client with llmConfig.apiKey
        return `{:response-type :text :content "Google Gemini not yet implemented - SDK needed"}`;
      } else {
        return `{:response-type :text :content "Google Gemini not available - no API key configured for this client"}`;
      }
    }
    
    if (llmConfig.provider === 'mistral') {
      if (llmConfig.apiKey) {
        // TODO: Create Mistral client with llmConfig.apiKey
        return `{:response-type :text :content "Mistral not yet implemented - SDK needed"}`;
      } else {
        return `{:response-type :text :content "Mistral not available - no API key configured for this client"}`;
      }
    }
    
    // Call the now-async buildConversationalPrompt with database parameters
    const prompt = await buildConversationalPrompt({
      clientName,
      conversationContext,
      content,
      context,
      gameState,
      clientId,
      pool: req.pool,
      userId
      // avatarId removed - avatar system eliminated
    });
    
    console.log('🔍 STEP 8: Sending prompt to LLM');
    console.log('🔍 Prompt length:', prompt.length, 'characters');
    console.log('🔍 Context included in prompt:', conversationContext.length > 0 ? 'YES' : 'NO');

    let message;
    
    // Call appropriate LLM provider with client-specific instances
    if (llmConfig.provider === 'anthropic') {
      message = await anthropicClient.messages.create({
        model: llmConfig.model,
        max_tokens: llmConfig.maxTokens,
        temperature: llmConfig.temperature || 0.7,
        messages: [{ role: 'user', content: prompt }]
      });
      return processLLMResponse(message.content[0].text);
      
    } else if (llmConfig.provider === 'openai') {
      message = await openaiClient.chat.completions.create({
        model: llmConfig.model,
        max_tokens: llmConfig.maxTokens,
        temperature: llmConfig.temperature || 0.7,
        messages: [{ role: 'user', content: prompt }]
      });
      return processLLMResponse(message.choices[0].message.content);
      
    } else if (llmConfig.provider === 'google') {
      // Google Gemini API call
      message = await req.google.generateContent({
        model: llmConfig.model,
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: llmConfig.maxTokens
        }
      });
      return processLLMResponse(message.response.text());
      
    } else if (llmConfig.provider === 'mistral') {
      // Mistral API call
      message = await req.mistral.chat({
        model: llmConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: llmConfig.maxTokens
      });
      return processLLMResponse(message.choices[0].message.content);
      
    } else {
      throw new Error(`Unsupported LLM provider: ${llmConfig.provider}`);
    }
    
  } catch (llmError) {
    console.error('LLM Error:', llmError);
    return `{:response-type :text :content "Error generating response: ${llmError.message}"}`;
  }
}