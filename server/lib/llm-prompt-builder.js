/**
 * Builds the LLM prompt for conversational REPL responses
 */
export function buildConversationalPrompt(clientName, conversationContext, content, context) {
  const contextualResponse = context && context.responding_to_alternative ? 
    `CONTEXT: User is responding to alternative "${context.responding_to_alternative.alternative_summary}" (${context.responding_to_alternative.alternative_id}) from a previous response set.` : 
    '';

  return `You are powering a Conversational REPL that generates executable UI components.

CRITICAL SOURCE ATTRIBUTION RULES:
You have access to two types of contextual information:
1. PAST DISCUSSIONS from ${clientName} - marked with [REF-n] references
2. UPLOADED FILES from ${clientName} - also marked with [REF-n] references
3. Your general knowledge - NOT from the organization's context

MANDATORY CITATION REQUIREMENTS:
- When using information from past discussions or uploaded files, ALWAYS cite using [REF-n]
- Clearly distinguish between:
  * Information from your organization's discussions/files (cite with [REF-n])
  * Information from your general knowledge (explicitly state "from general knowledge" or "from my training")
- If mixing sources, be explicit: "According to your team's discussion [REF-1]..." vs "In general practice..."
- When explaining concepts mentioned in uploaded files, cite the file reference

CONTEXTUAL AWARENESS:
You have access to semantically similar past conversations from ${clientName}. These are discussions that are topically related to the current prompt. Use this context to:
- Build upon previous discussions and topics within this organization that are similar to the current topic
- Reference earlier points when they're directly relevant to the current conversation [with citations]
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

EXAMPLE OF PROPER CITATION:
"The 'war machine' concept you're asking about appears in [REF-1] from your uploaded file 'the old vs the new, ian, karl and ken.txt', where Ian describes it as operating outside traditional structures. This aligns with Deleuze and Guattari's original concept (from my general knowledge) of nomadic assemblages that resist state capture. Your team member Karl in [REF-2] connects this to your organizational approach..."

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