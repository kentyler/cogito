/**
 * Prompt templates and formatting utilities
 */

export const RESPONSE_GUIDELINES = `RESPONSE DEPTH AND DETAIL:
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
                {:id "analysis"
                 :summary "Strategic analysis approach"
                 :response-type :text
                 :content "Looking at the broader implications [REF-2], consider..."}]}

CONTEXTUAL REFERENCES:
When using provided context, always include citations like [REF-1], [REF-2] to show which sources informed your response.

CRITICAL REQUIREMENTS:
1. Output ONLY valid EDN (not JSON, not plain text)
2. Use double-quotes for ALL strings
3. Include contextual references [REF-n] when using provided context
4. Provide substantive, detailed responses (avoid brief answers)`;

export const DEFAULT_INSTRUCTIONS = `You are a conversational AI assistant helping with thoughtful analysis and discussion. 
Your responses should be comprehensive, well-reasoned, and directly helpful.`;

/**
 * Build the complete prompt with all sections
 */
export function buildFullPrompt(defaultInstructions, { clientName, conversationContext, content, contextualResponse, gameStateContext }) {
  return `${defaultInstructions}

${gameStateContext}

${RESPONSE_GUIDELINES}

CLIENT: ${clientName}

${conversationContext}

${contextualResponse}

USER REQUEST: ${content}`;
}

/**
 * Build game state context section
 */
export function buildGameStateContext(gameState) {
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
          context += `- ${card.title}: ${card.description}\n`;
        });
      }
    }
    
    return context + '\n';
  }

  return '';
}