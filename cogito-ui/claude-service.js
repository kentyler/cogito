const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    // Initialize with API key from environment or .env file
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('WARNING: ANTHROPIC_API_KEY not found in environment');
      console.error('Please set ANTHROPIC_API_KEY environment variable');
      this.client = null;
    } else {
      this.client = new Anthropic({
        apiKey: apiKey
      });
    }
  }

  async generateResponse(prompt) {
    if (!this.client) {
      return {
        success: false,
        error: 'Claude API not configured. Please set ANTHROPIC_API_KEY environment variable.'
      };
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307', // Using Haiku for fast responses
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return {
        success: true,
        content: response.content[0].text
      };
    } catch (error) {
      console.error('Claude API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate response'
      };
    }
  }

  async generateSummary(conversationContent, context = {}) {
    const summaryPrompt = `Please create a concise but detailed summary of recent team activity based on the following conversation content. 

Context:
- Client: ${context.clientName || 'Unknown'}
- Time Period: Last 30 days
- Number of team members: ${context.teamSize || 'Unknown'}

Focus on:
- Key topics and themes discussed
- Important decisions or conclusions reached
- Current projects or initiatives mentioned
- Any patterns or recurring themes
- Notable insights or breakthroughs

Recent conversation content:
${conversationContent}

Provide a well-structured summary that would help someone understand what the team has been working on recently. Use clear headings and bullet points where appropriate.`;

    return await this.generateResponse(summaryPrompt);
  }

  async analyzeConversation(userPrompt, conversationData, userContext) {
    const analysisPrompt = `You are Cogito, an AI system that can access conversation history and patterns through semantic search of embedded content in the database.

User Context:
- User ID: ${userContext.id}
- Email: ${userContext.email}
- Display Name: ${userContext.display_name}
- Client ID: ${userContext.client_id}
- Client Name: ${userContext.client_name}

Data Scope:
- You have access to conversations across ALL users in client "${userContext.client_name}"
- This includes interactions from multiple team members, not just this user
- Use semantic search to find relevant patterns, insights, and conversations

Conversation Data Provided:
${conversationData ? conversationData : 'No specific conversation data provided for this query.'}

User Request: ${userPrompt}

Interpret this request and provide a helpful response. Focus on insights and patterns that span the client organization.`;

    return await this.generateResponse(analysisPrompt);
  }

  async updateClientStory(currentStory, newEvent, clientContext) {
    const updatePrompt = `You are helping maintain a living client story that gets updated as events occur. 

Current Client Story:
${currentStory}

New Event to Integrate:
${newEvent}

Client Context:
- Client Name: ${clientContext.clientName}
- Client ID: ${clientContext.clientId}

Please update the client story to incorporate this new event. The story should:
- Maintain narrative continuity
- Highlight key themes and patterns
- Be concise but informative
- Focus on meaningful developments
- Preserve important historical context

Return ONLY the updated story text, nothing else.`;

    return await this.generateResponse(updatePrompt);
  }
}

module.exports = ClaudeService;