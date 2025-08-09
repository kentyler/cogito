/**
 * Helper functions for webhook chat processing
 */

// Generate response for directed questions
export async function generateDirectedResponse(webhookService, meeting, messageText, conversationText, anthropic) {
  // Extract the actual question after "cogito"
  const questionMatch = messageText.match(/cogito[,:]?\s*(.+)/i);
  const question = questionMatch ? questionMatch[1].trim() : messageText;
  
  // Get relevant file content
  const clientId = meeting.client_id || 6; // Default to cogito client
  const relevantFileContent = await webhookService.getRelevantFileContent(meeting.id, question, clientId);
  
  const prompt = `You are Cogito, an AI assistant helping with this meeting. You have access to the conversation transcript and any relevant uploaded documents, but you can also use your general knowledge to be helpful.

CONVERSATION TRANSCRIPT:
${conversationText}${relevantFileContent}

PARTICIPANT'S QUESTION: "${question}"

Please provide a helpful response that:
- First considers the meeting content and uploaded documents if relevant to the question
- Can draw on your general knowledge when appropriate to give comprehensive answers
- Is conversational and engaging (not limited to just meeting content)
- Can discuss topics beyond what's been covered in the meeting if that would be helpful
- Provides practical insights and actionable information when possible

Be thorough in your response while remaining clear and conversational. If the question relates to people mentioned in the meeting, reference the transcript context, but don't limit yourself only to meeting content if broader knowledge would be valuable.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }]
  });
  
  return message.content[0].text;
}

// Generate summary response for '?' command
export async function generateSummaryResponse(webhookService, meeting, conversationText, anthropic) {
  // Get uploaded files context
  const uploadedFilesContext = await webhookService.getUploadedFilesContext(meeting.id);
  
  const prompt = `You are Cogito, an AI assistant providing a meeting status update. Analyze the conversation and provide insights.

CONVERSATION TRANSCRIPT:
${conversationText}${uploadedFilesContext}

Please provide a helpful status update that includes:
- Current discussion topics and themes
- Key insights or decisions that have emerged
- Notable participant contributions or perspectives
- Any patterns, tensions, or opportunities you observe
- Suggestions for productive next steps if appropriate

Be insightful and analytical while remaining conversational. You can offer observations that go beyond just summarizing what was said - provide value through your analysis of the conversation dynamics and content. If the conversation is light or just starting, acknowledge that and offer to help in other ways.`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  });
  
  return message.content[0].text;
}

// Send response back to meeting chat
export async function sendChatResponse(botId, response, meetingId, appendToConversation) {
  try {
    console.log('📤 Sending response to meeting chat:', response);
    
    const chatResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/send_chat_message/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: response
      })
    });
    
    if (chatResponse.ok) {
      console.log('✅ Chat response sent successfully');
      
      // Append Cogito's response to the conversation timeline
      const cogitoEntry = `[Cogito via chat] ${response}\n`;
      await appendToConversation(meetingId, cogitoEntry);
      console.log('📝 Appended Cogito response to timeline');
    } else {
      const errorText = await chatResponse.text();
      console.error('❌ Failed to send chat response:', chatResponse.status, errorText);
    }
  } catch (chatError) {
    console.error('❌ Error sending chat response:', chatError);
  }
}