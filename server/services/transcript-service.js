// Transcript processing service for real-time meeting transcription
export class TranscriptService {
  constructor(pool) {
    this.pool = pool;
    this.meetingBuffers = new Map();
    this.meetingSpeakerAgents = new Map();
    
    // Agent classes will be set by server initialization
    this.TranscriptBufferAgent = null;
    this.TurnEmbeddingAgent = null;
    this.SpeakerProfileAgent = null;
    this.embeddingAgent = null;
  }

  // Initialize agent classes (called from server startup)
  setAgentClasses(TranscriptBufferAgent, TurnEmbeddingAgent, SpeakerProfileAgent, embeddingAgent) {
    this.TranscriptBufferAgent = TranscriptBufferAgent;
    this.TurnEmbeddingAgent = TurnEmbeddingAgent;
    this.SpeakerProfileAgent = SpeakerProfileAgent;
    this.embeddingAgent = embeddingAgent;
  }

  // Process individual transcript chunks from WebSocket
  async processTranscriptChunk(meeting, speakerName, text) {
    const meetingId = meeting.id;
    
    // Get or create speaker profile agent for this meeting
    let speakerAgent = this.meetingSpeakerAgents.get(meetingId);
    if (!speakerAgent) {
      speakerAgent = new this.SpeakerProfileAgent({
        meetingUrl: meeting.meeting_url,
        profileTurnLimit: 50
      });
      this.meetingSpeakerAgents.set(meetingId, speakerAgent);
      console.log(`👥 Created speaker profile agent for meeting ${meetingId} with context: ${speakerAgent.context}`);
    }
    
    // Get or create transcript buffer for this meeting
    let buffer = this.meetingBuffers.get(meetingId);
    if (!buffer) {
      buffer = new this.TranscriptBufferAgent({
        maxLength: 1000,
        onTurnReady: async (turn) => {
          // Process speaker profile first to get user_id
          const userId = await speakerAgent.processSpeaker(turn.speaker, turn.meetingId);
          
          // Add user_id to turn if speaker was identified
          if (userId) {
            turn.user_id = userId;
            console.log(`[Transcript] Identified speaker ${turn.speaker} as user_id: ${userId}`);
          }
          
          // Send to embedding agent for async processing
          await this.embeddingAgent.processTurn(turn);
        }
      });
      
      // Initialize buffer for this meeting
      buffer.startNewBlock({
        meetingId: meeting.id,
        clientId: meeting.client_id || 6 // Default to cogito client
      });
      
      this.meetingBuffers.set(meetingId, buffer);
      console.log(`🔧 Created transcript buffer for meeting ${meetingId}`);
    }
    
    // Add chunk to buffer (will trigger flush when appropriate)
    await buffer.addChunk({
      speaker: speakerName,
      text: text,
      timestamp: new Date()
    });
  }

  // End transcript processing for a meeting
  async endMeetingTranscriptProcessing(meetingId) {
    const buffer = this.meetingBuffers.get(meetingId);
    const speakerAgent = this.meetingSpeakerAgents.get(meetingId);
    
    let summary = null;
    if (buffer) {
      summary = await buffer.endBlock();
      this.meetingBuffers.delete(meetingId);
      console.log(`🏁 Ended transcript processing for meeting ${meetingId}: ${summary.totalTurns} turns processed`);
    }
    
    if (speakerAgent) {
      const stats = speakerAgent.getStats();
      this.meetingSpeakerAgents.delete(meetingId);
      console.log(`👥 Cleaned up speaker agent for meeting ${meetingId}: ${stats.cachedSpeakers} speakers, ${stats.processedSpeakers} profiles generated`);
    }
    
    return summary;
  }

  // Get buffer and speaker agent references for meeting service
  getBuffers() {
    return {
      meetingBuffers: this.meetingBuffers,
      meetingSpeakerAgents: this.meetingSpeakerAgents
    };
  }
}