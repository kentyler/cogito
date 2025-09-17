// Webhook service for processing chat messages from Recall.ai
// Database fields verified: recall_bot_id, file_id, meeting_id are standard schema fields
import { DatabaseAgent } from '#database/database-agent.js';

export class WebhookService {
  constructor(db, anthropic, embeddingService) {
    this.db = db; // Keep for legacy compatibility
    this.anthropic = anthropic;
    this.embeddingService = embeddingService; // Use embedding service instead of file upload service
    this.dbAgent = new DatabaseAgent();
    this.dbAgentConnected = false;
  }

  async ensureDbAgent() {
    if (!this.dbAgentConnected) {
      await this.dbAgent.connect();
      this.dbAgentConnected = true;
    }
  }

  // Extract and validate webhook data
  extractWebhookData(requestBody) {
    const { data } = requestBody;
    
    if (!data) {
      throw new Error('No data in chat webhook');
    }
    
    const botId = data.bot?.id;
    const messageText = data.data?.data?.text;
    const participantData = data.data?.participant;
    const senderName = participantData?.name || 'Unknown';
    
    if (!messageText || !botId) {
      throw new Error('Missing message or bot ID in chat webhook');
    }
    
    return { botId, messageText, senderName };
  }

  // Find meeting by bot ID
  async findMeetingByBot(botId) {
    await this.ensureDbAgent();
    const meeting = await this.dbAgent.meetings.getByBotId(botId, ['system']);
    
    if (!meeting) {
      throw new Error(`No meeting found for bot ${botId}`);
    }
    
    return meeting;
  }

  // Check if message is a command or question
  isCommandMessage(messageText, senderName) {
    // Ignore messages from Cogito itself to prevent loops
    if (senderName === 'Cogito' || senderName.toLowerCase().includes('cogito')) {
      return { isLoop: true };
    }
    
    const lowerMessage = messageText.toLowerCase().trim();
    const isQuestion = messageText.trim() === '?';
    const isDirectedAtCogito = lowerMessage.startsWith('cogito') || 
                               lowerMessage.startsWith('hi cogito') || 
                               lowerMessage.startsWith('hey cogito') ||
                               lowerMessage.startsWith('hello cogito');
    
    return { 
      isLoop: false,
      isQuestion, 
      isDirectedAtCogito,
      isCommand: isQuestion || isDirectedAtCogito
    };
  }

  // Get conversation context from meeting
  async getConversationContext(meetingId) {
    await this.ensureDbAgent();
    const meeting = await this.dbAgent.meetings.getById(meetingId);
    
    const transcriptArray = meeting?.full_transcript || [];
    
    if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
      return { hasContent: false, transcriptArray: [], conversationText: '' };
    }
    
    const conversationText = transcriptArray
      .map(entry => entry.content || '')
      .join('\n');
    
    return { hasContent: true, transcriptArray, conversationText };
  }

  // Get relevant file content for context
  async getRelevantFileContent(meetingId, question, clientId) {
    try {
      await this.ensureDbAgent();
      
      // Check if there are any file turns associated with this meeting
      const meetingFileTurns = await this.dbAgent.connector.query(`
        SELECT id, metadata->>'filename' as filename 
        FROM meetings.turns 
        WHERE meeting_id = $1 AND source_type = 'file_upload'
      `, [meetingId]);
      
      // Only search files if there are file turns associated with this meeting
      if (meetingFileTurns.rows.length === 0) {
        return '';
      }
      
      // Generate embedding for the question
      const questionEmbedding = await this.embeddingService.generateEmbedding(question);
      const embeddingString = this.embeddingService.formatForDatabase(questionEmbedding);
      
      // Search turn embeddings for similar content from file turns in this meeting
      const fileSearchResults = await this.dbAgent.connector.query(`
        SELECT 
          te.content_text,
          t.metadata->>'filename' as filename,
          1 - (te.embedding_vector <=> $1::vector) as similarity
        FROM meetings.turn_embeddings te
        JOIN meetings.turns t ON te.turn_id = t.id
        WHERE t.meeting_id = $2 
          AND t.source_type = 'file_upload'
          AND t.client_id = $3
          AND te.embedding_vector IS NOT NULL
          AND 1 - (te.embedding_vector <=> $1::vector) >= 0.6
        ORDER BY similarity DESC
        LIMIT 3
      `, [embeddingString, meetingId, clientId]);
      
      if (fileSearchResults.rows.length === 0) {
        return '';
      }
      
      return '\n\nRELEVANT UPLOADED DOCUMENTS:\n' + 
        fileSearchResults.rows.map(result => 
          `From ${result.filename}: ${result.content_text.substring(0, 500)}...`
        ).join('\n\n');
        
    } catch (fileError) {
      console.error('Error querying files:', fileError);
      return '';
    }
  }

  // Get uploaded files context for summary
  async getUploadedFilesContext(meetingId) {
    try {
      await this.ensureDbAgent();
      const uploadedFiles = await this.dbAgent.connector.query(`
        SELECT 
          t.metadata->>'filename' as filename,
          t.metadata->>'description' as description
        FROM meetings.turns t
        WHERE t.meeting_id = $1 AND t.source_type = 'file_upload'
      `, [meetingId]);
      
      if (uploadedFiles.rows.length === 0) {
        return '';
      }
      
      return '\n\nUPLOADED MEETING RESOURCES:\n' + 
        uploadedFiles.rows.map(file => `- ${file.filename}`).join('\n');
        
    } catch (fileError) {
      console.error('Error getting uploaded files:', fileError);
      return '';
    }
  }
}