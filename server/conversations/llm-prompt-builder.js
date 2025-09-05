/**
 * Builds the LLM prompt for conversational REPL responses - Refactored
 */

import { withDbAgent } from './lib/db-wrapper.js';
import { buildFullPrompt, buildGameStateContext, DEFAULT_INSTRUCTIONS } from './lib/prompt-templates.js';

/**
 * Build the main conversational prompt with context
 * @param {Object} options - Prompt building options
 * @returns {Promise<string>} Complete prompt for LLM
 */
export async function buildConversationalPrompt({ clientName, conversationContext, content, context, gameState, clientId, pool, userId = null }) {
  // Build game state context
  const gameStateContext = buildGameStateContext(gameState);
  
  // Build contextual response section
  let contextualResponse = '';
  if (context && context.length > 0) {
    contextualResponse = 'CONTEXTUAL INFORMATION:\nThe following information from your files and previous conversations may be relevant:\n\n';
    context.forEach((item, index) => {
      contextualResponse += `[REF-${index + 1}] ${item.content}\n\n`;
    });
  }

  // Get client instructions from database
  let defaultInstructions = DEFAULT_INSTRUCTIONS;
  if (clientId) {
    const clientInstructions = await withDbAgent(async (dbAgent) => {
      return await dbAgent.clients.getClientInstructions(clientId);
    });
    
    if (clientInstructions) {
      defaultInstructions = clientInstructions;
    }
  }

  return buildFullPrompt(defaultInstructions, {
    clientName,
    conversationContext,
    content,
    contextualResponse,
    gameStateContext
  });
}

/**
 * Process and format LLM response
 * @param {string} responseText - Raw response from LLM
 * @returns {Object} Parsed and formatted response
 */
export function processLLMResponse(responseText) {
  try {
    // Simple EDN-like parsing for response structure
    if (responseText.includes(':response-type :text')) {
      const contentMatch = responseText.match(/:content\s+"([^"]+)"/);
      if (contentMatch) {
        return {
          type: 'text',
          content: contentMatch[1]
        };
      }
    }
    
    if (responseText.includes(':response-type :response-set')) {
      // Handle multiple responses - simplified parsing
      return {
        type: 'response-set',
        content: responseText,
        alternatives: [] // Would need more complex parsing for full functionality
      };
    }
    
    // Fallback - return as plain text
    return {
      type: 'text',
      content: responseText
    };
  } catch (error) {
    console.error('Error processing LLM response:', error);
    return {
      type: 'text',
      content: responseText
    };
  }
}