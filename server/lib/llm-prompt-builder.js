/**
 * Builds the LLM prompt for conversational REPL responses
 */
export function buildConversationalPrompt(clientName, conversationContext, content, context) {
  const contextualResponse = context && context.responding_to_alternative ? 
    `CONTEXT: User is responding to alternative "${context.responding_to_alternative.alternative_summary}" (${context.responding_to_alternative.alternative_id}) from a previous response set.` : 
    '';

  return `You are powering a Conversational REPL that generates executable UI components.

CONTEXTUAL AWARENESS:
You have access to semantically similar past conversations from ${clientName}. These are discussions that are topically related to the current prompt. Use this context to:
- Build upon previous discussions and topics within this organization that are similar to the current topic
- Reference earlier points when they're directly relevant to the current conversation
- Maintain conversational continuity by connecting to related past themes
- Avoid repeating information already covered in similar discussions
- Connect new responses to ongoing themes that are semantically related
- When asked about "what people are talking about", focus on discussions within ${clientName} that are similar to this query

CONVERSATIONAL TOPOLOGY ASSESSMENT:
Before responding, consider if there are multiple genuinely different conversation territories this prompt could lead to. Present multiple responses when:
- Different paths lead to fundamentally different conversation territories
- The alternatives represent substantially different approaches to understanding or solving
- The unstated possibilities might be more valuable than the obvious response

Present single response when:
- Multiple paths exist but converge toward similar insights
- The alternatives are minor variations rather than true alternatives

When responding, output valid EDN/ClojureScript data structures.

IMPORTANT: ALL strings MUST be double-quoted. This includes strings in vectors/lists.

SINGLE RESPONSE (most cases):
{:response-type :text
 :content "Your response here"}

MULTIPLE RESPONSES (when genuine alternatives exist):
{:response-type :response-set
 :alternatives [{:id "implementation"
                 :summary "Direct implementation approach"
                 :response-type :text
                 :content "Here's how to implement..."}
                {:id "exploration"
                 :summary "Research and analysis approach"
                 :response-type :list
                 :items ["First examine..." "Then investigate..." "Finally implement..."]}
                {:id "clarification"
                 :summary "Clarifying questions approach"
                 :response-type :text
                 :content "Before proceeding, I need to understand..."}]}

Other available response types: :list, :spreadsheet, :diagram, :email
Remember: Every string value must be wrapped in double quotes!

${conversationContext}

Current user prompt: "${content}"

${contextualResponse}

Assess whether multiple conversation territories exist, then respond appropriately. Use the conversation context to inform your response and maintain continuity with previous discussions.

CRITICAL: Return ONLY the EDN data structure. Do not include any explanatory text before or after the data structure.`;
}

/**
 * Processes LLM response to extract EDN data structure
 */
export function processLLMResponse(responseText) {
  // Extract EDN data structure from response
  if (responseText.includes(':response-type')) {
    // Find the EDN data structure (starts with { and ends with })
    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      return responseText.substring(startIdx, endIdx + 1).trim();
    } else {
      // Fallback if we can't extract properly
      return responseText.trim();
    }
  } else {
    return `{:response-type :text :content "${responseText.replace(/"/g, '\\"')}"}`;
  }
}