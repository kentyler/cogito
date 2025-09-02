/**
 * Builds the LLM prompt for conversational REPL responses
 */
import { selectAvatar, loadAvatar, processAvatarTemplate } from '#server/clients/avatar-system.js';

/**
 * Builds game state context information for the prompt
 */
function buildGameStateContext(gameState) {
  if (!gameState) {
    return '';
  }

  if (gameState.needsStateDeclaration) {
    return `GAME STATE ALERT:
${gameState.message}

Please acknowledge our working approach before proceeding with the response.`;
  }

  if (gameState.stateChanged && gameState.currentState) {
    let context = 'DESIGN GAME STATE:\n';
    
    if (gameState.currentState.type === 'identified') {
      context += `🎮 ACTIVE GAME: "${gameState.currentState.displayName}"\n`;
      context += `Cards and design patterns are being tracked for this game.\n`;
      
      if (gameState.relevantCards && Object.keys(gameState.relevantCards).length > 0) {
        context += `Available cards from this game:\n`;
        Object.entries(gameState.relevantCards).forEach(([key, card]) => {
          context += `- ${key}: ${card.pattern} (${card.suit})\n`;
        });
      }
    } else if (gameState.currentState.type === 'unidentified') {
      context += `🔍 UNIDENTIFIED MODE: Working without a specific design game framework.\n`;
      context += `Design decisions will be made contextually rather than following established patterns.\n`;
    }
    
    return context;
  }

  if (gameState.currentState && gameState.currentState.type !== 'undeclared') {
    let context = 'CURRENT DESIGN GAME STATE:\n';
    
    if (gameState.currentState.type === 'identified') {
      context += `🎮 Playing: "${gameState.currentState.displayName}"\n`;
    } else {
      context += `🔍 Mode: Unidentified exploration\n`;
    }
    
    return context;
  }

  return '';
}

/**
 * Build the full prompt combining avatar instructions with shared components
 */
function buildFullPrompt(avatarInstructions, { clientName, conversationContext, content, contextualResponse, gameStateContext }) {
  return `${avatarInstructions}

${gameStateContext}

RESPONSE DEPTH AND DETAIL:
IMPORTANT: You have a 4000 token limit - use it effectively. Provide comprehensive, thoughtful responses that:
- Explore the topic in sufficient depth and nuance (500-800 words when warranted)
- Connect ideas and provide relevant examples with specific details
- Offer practical insights and actionable information with clear steps
- Build upon the specific context from the organization's discussions and files
- Are substantive enough to be genuinely helpful - DO NOT give brief or superficial answers
- Include analysis, implications, and connections between concepts
- When referencing past discussions, explain what they contain and why they're relevant

CONVERSATIONAL TOPOLOGY ASSESSMENT:
Consider multiple response alternatives ONLY when there are genuinely different philosophical or strategic approaches. Present multiple responses when:
- Fundamentally different paradigms or frameworks apply (e.g., tactical vs strategic, individual vs systemic approaches)
- The alternatives represent truly different schools of thought or methodologies
- The unstated possibilities would lead to completely different outcomes

Present single, detailed response when:
- The query has a clear primary direction (most cases)
- Multiple aspects can be covered within one comprehensive response
- The alternatives would be variations on the same theme

When responding, output valid EDN/ClojureScript data structures.

IMPORTANT: ALL strings MUST be double-quoted. This includes strings in vectors/lists.

SINGLE RESPONSE (most cases):
{:response-type :text
 :content "Your response here with [REF-1] citations when using context"}

MULTIPLE RESPONSES (when genuine alternatives exist):
{:response-type :response-set
 :alternatives [{:id "implementation"
                 :summary "Direct implementation approach"
                 :response-type :text
                 :content "Based on your team's discussion [REF-1], here's how to implement..."}
                {:id "exploration"
                 :summary "Research and analysis approach"
                 :response-type :list
                 :items ["First examine the concept from [REF-2]..." "Then investigate (from general knowledge)..." "Finally implement as discussed in [REF-3]..."]}
                {:id "clarification"
                 :summary "Clarifying questions approach"
                 :response-type :text
                 :content "Before proceeding, I need to understand..."}]}

REFERENCE FORMAT REQUIREMENTS:
When citing sources, make [REF-n] labels meaningful by explaining:
- What type of content it is (discussion, document, meeting notes)
- When it occurred (approximate date if available) 
- Who was involved (if it's a discussion)
- What specific topic or aspect it covers
This helps users understand why each reference is relevant and what they can expect if they look it up.

Other available response types: :list, :spreadsheet, :diagram, :email
Remember: Every string value must be wrapped in double quotes!

${conversationContext}

Current user prompt: "${content}"

${contextualResponse}

Assess whether multiple conversation territories exist, then respond appropriately. Use the conversation context to inform your response and maintain continuity with previous discussions.

CRITICAL: Return ONLY the EDN data structure. Do not include any explanatory text before or after the data structure.`;
}

/**
 * Build conversational prompt with avatar instructions and context
 * @param {Object} options
 * @param {string} options.clientName - Client name for personalization
 * @param {string} options.conversationContext - Previous conversation context
 * @param {string} options.content - User's current message content
 * @param {Object} options.context - Additional context information
 * @param {Object} options.gameState - Current game state if applicable
 * @param {string} options.clientId - Client ID for avatar selection
 * @param {Object} options.pool - Database connection pool
 * @param {string} [options.userId] - User ID for avatar preference
 * @param {string} [options.avatarId] - Specific avatar ID to use
 * @returns {Promise<string>} Complete conversational prompt
 */
export async function buildConversationalPrompt({ clientName, conversationContext, content, context, gameState, clientId, pool, userId = null, avatarId = null }) {
  const contextualResponse = context && context.responding_to_alternative ? 
    `CONTEXT: User is responding to alternative "${context.responding_to_alternative.alternative_summary}" (${context.responding_to_alternative.alternative_id}) from a previous response set.` : 
    '';

  // Select and load avatar from database
  const avatar = await selectAvatar({ 
    databasePool: pool,
    clientId, 
    userId, 
    avatarId, 
    selectionContext: 'general' 
  });
  
  // Process avatar template with variables
  const avatarInstructions = processAvatarTemplate(avatar, {
    clientName: clientName
  });

  // Build the full prompt with avatar instructions and shared components
  return buildFullPrompt(avatarInstructions, {
    clientName,
    conversationContext,
    content,
    contextualResponse,
    gameStateContext: buildGameStateContext(gameState)
  });
}

/**
 * Processes LLM response to extract EDN data structure
 */
export function processLLMResponse(responseText) {
  // Try to extract EDN data structure from response
  const startIdx = responseText.indexOf('{');
  const endIdx = responseText.lastIndexOf('}');
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const ednStr = responseText.substring(startIdx, endIdx + 1).trim();
    
    // Check if it's a valid response structure with :response-type
    if (ednStr.includes(':response-type')) {
      return ednStr;
    } else {
      // It's EDN but missing :response-type, wrap the entire structure
      // This handles cases like {:date "..." :summary "..."}
      return `{:response-type :text :content ${ednStr}}`;
    }
  }
  
  // No EDN structure found, wrap as plain text
  return `{:response-type :text :content "${responseText.replace(/"/g, '\\"')}"}`;
}