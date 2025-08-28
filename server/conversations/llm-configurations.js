/**
 * LLM Model Configurations
 * Static configuration data for all supported LLM providers
 */

// LLM configurations with provider details
export const LLM_CONFIGS = {
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000,
    description: 'Anthropic\'s latest high-performance model'
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    maxTokens: 4000,
    description: 'Fast and efficient model for quick responses'
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 4000,
    description: 'OpenAI\'s flagship model'
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    maxTokens: 4000,
    description: 'Fast and cost-effective OpenAI model'
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    model: 'gpt-4o',
    maxTokens: 4000,
    description: 'OpenAI\'s latest multimodal model'
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    model: 'gpt-4-turbo',
    maxTokens: 4000,
    description: 'Faster version of GPT-4'
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    maxTokens: 4000,
    description: 'Anthropic\'s most capable model'
  },
  'gemini-pro': {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    model: 'gemini-pro',
    maxTokens: 4000,
    description: 'Google\'s flagship AI model'
  },
  'mistral-large': {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    model: 'mistral-large-latest',
    maxTokens: 4000,
    description: 'Mistral AI\'s most capable model'
  }
};

// Default LLM if none specified
export const DEFAULT_LLM = 'claude-3-5-sonnet';