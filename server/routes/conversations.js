import express from 'express';
import { createTurn } from '../lib/turn-compatibility.js';
import { buildConversationContext, getClientInfo } from '../lib/conversation-context.js';

const router = express.Router();

// Conversational REPL endpoint
router.post('/conversational-turn', async (req, res) => {
  try {
    const { content, conversation_id, meeting_id, context } = req.body;
    
    // Development mode: use a default user if no session
    let user_id;
    if (req.session && req.session.user) {
      user_id = req.session.user.user_id;
    } else if (process.env.NODE_ENV !== 'production') {
      // Default to user 1 (ken@8thfold.com) in development
      user_id = 1;
      console.log('Development mode: Using default user_id=1');
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Store the user's prompt as a turn with embedding
    const userTurn = await createTurn(req, {
      user_id: user_id,
      content: content,
      source_type: 'conversational-repl-user',
      metadata: { conversation_id },
      meeting_id: meeting_id  // Associate turn with meeting if provided
    });
    
    // Get the current user's client_id to filter discussions
    const { clientId, clientName } = await getClientInfo(req, user_id);

    // Get semantically similar conversation history for context
    const conversationContext = await buildConversationContext(req, userTurn, clientId);
    
    // Generate LLM response
    let llmResponse;
    try {
      if (req.anthropic) {
        const prompt = `You are powering a Conversational REPL that generates executable UI components.

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

${context && context.responding_to_alternative ? 
  `CONTEXT: User is responding to alternative "${context.responding_to_alternative.alternative_summary}" (${context.responding_to_alternative.alternative_id}) from a previous response set.` : 
  ''}

Assess whether multiple conversation territories exist, then respond appropriately. Use the conversation context to inform your response and maintain continuity with previous discussions.

CRITICAL: Return ONLY the EDN data structure. Do not include any explanatory text before or after the data structure.`;

        const message = await req.anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        });
        
        let responseText = message.content[0].text;
        
        // Extract EDN data structure from response
        if (responseText.includes(':response-type')) {
          // Find the EDN data structure (starts with { and ends with })
          const startIdx = responseText.indexOf('{');
          const endIdx = responseText.lastIndexOf('}');
          
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            llmResponse = responseText.substring(startIdx, endIdx + 1).trim();
          } else {
            // Fallback if we can't extract properly
            llmResponse = responseText.trim();
          }
        } else {
          llmResponse = `{:response-type :text :content "${responseText.replace(/"/g, '\\"')}"}`;
        }
        
      } else {
        llmResponse = `{:response-type :text :content "Claude not available - check ANTHROPIC_API_KEY"}`;
      }
    } catch (llmError) {
      console.error('LLM Error:', llmError);
      llmResponse = `{:response-type :text :content "Error generating response: ${llmError.message}"}`;
    }
    
    // Check if this is a response-set (multiple alternatives)
    let llmTurn;
    if (llmResponse.includes(':response-set')) {
      // Parse the response to extract alternatives
      try {
        // For now, store the complete response-set as a single turn
        // The frontend will handle parsing and navigation
        llmTurn = await createTurn(req, {
          user_id: user_id,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_turn_id: userTurn.turn_id,
          meeting_id: meeting_id,  // Associate turn with meeting if provided
          metadata: { 
            conversation_id, 
            user_turn_id: userTurn.turn_id,
            response_type: 'response-set',
            has_alternatives: true
          }
        });
      } catch (parseError) {
        console.error('Error storing response-set:', parseError);
        // Fallback to single response
        llmTurn = await createTurn(req, {
          user_id: user_id,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_turn_id: userTurn.turn_id,
          meeting_id: meeting_id,  // Associate turn with meeting if provided
          metadata: { 
            conversation_id, 
            user_turn_id: userTurn.turn_id,
            response_type: 'clojure-data'
          }
        });
      }
    } else {
      // Store single response as before
      llmTurn = await createTurn(req, {
        user_id: user_id,
        content: llmResponse,
        source_type: 'conversational-repl-llm',
        source_turn_id: userTurn.turn_id,
        meeting_id: meeting_id,  // Associate turn with meeting if provided
        metadata: { 
          conversation_id, 
          user_turn_id: userTurn.turn_id,
          response_type: 'clojure-data'
        }
      });
    }
    
    res.json({
      id: llmTurn.turn_id,
      user_turn_id: userTurn.turn_id,
      prompt: content,
      response: llmResponse,
      conversation_id: conversation_id || userTurn.turn_id,
      created_at: llmTurn.created_at
    });
    
  } catch (error) {
    console.error('Conversational REPL error:', error);
    res.status(500).json({ error: 'Failed to process conversational turn' });
  }
});

export default router;