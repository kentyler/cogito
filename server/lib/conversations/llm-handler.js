/**
 * LLM interaction and response generation
 */
import { buildConversationalPrompt, processLLMResponse } from '../llm-prompt-builder.js';

export async function generateLLMResponse(req, { 
  clientName, 
  conversationContext, 
  content, 
  context 
}) {
  if (!req.anthropic) {
    return `{:response-type :text :content "Claude not available - check ANTHROPIC_API_KEY"}`;
  }
  
  try {
    const prompt = buildConversationalPrompt(clientName, conversationContext, content, context);
    
    console.log('🔍 STEP 8: Sending prompt to LLM');
    console.log('🔍 Prompt length:', prompt.length, 'characters');
    console.log('🔍 Context included in prompt:', conversationContext.length > 0 ? 'YES' : 'NO');

    const message = await req.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    });
    
    return processLLMResponse(message.content[0].text);
  } catch (llmError) {
    console.error('LLM Error:', llmError);
    return `{:response-type :text :content "Error generating response: ${llmError.message}"}`;
  }
}