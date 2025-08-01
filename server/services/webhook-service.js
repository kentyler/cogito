// Webhook service for processing chat messages from Recall.ai
export class WebhookService {
  constructor(db, anthropic, fileUploadService) {
    this.db = db;
    this.anthropic = anthropic;
    this.fileUploadService = fileUploadService;
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
    const meetingResult = await this.db.query(`
      SELECT * 
      FROM meetings
      WHERE recall_bot_id = $1 AND meeting_type != 'system'
    `, [botId]);
    
    if (meetingResult.rows.length === 0) {
      throw new Error(`No meeting found for bot ${botId}`);
    }
    
    return meetingResult.rows[0];
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
    const conversationResult = await this.db.query(
      'SELECT full_transcript FROM meetings WHERE meeting_id = $1',
      [meetingId]
    );
    
    const transcriptArray = conversationResult.rows[0]?.full_transcript || [];
    
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
      // First check if there are any files associated with this meeting
      const meetingFileIds = await this.db.query(`
        SELECT file_upload_id FROM meeting_files 
        WHERE meeting_id = $1
      `, [meetingId]);
      
      // Only search files if there are files associated with this meeting
      if (meetingFileIds.rows.length === 0) {
        return '';
      }
      
      // Use FileUploadService for semantic search
      const fileSearchResults = await this.fileUploadService.searchFileContent(question, clientId, 3);
      
      const meetingFileIdSet = new Set(meetingFileIds.rows.map(row => row.file_upload_id));
      const relevantResults = fileSearchResults.filter(result => 
        meetingFileIdSet.has(result.file_upload_id)
      );
      
      if (relevantResults.length === 0) {
        return '';
      }
      
      return '\n\nRELEVANT UPLOADED DOCUMENTS:\n' + 
        relevantResults.map(result => 
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
      const uploadedFiles = await this.db.query(`
        SELECT f.filename, f.metadata->>'description' as description
        FROM context.files f
        JOIN meetings.meeting_files mf ON mf.file_id = f.id
        WHERE mf.meeting_id = $1
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