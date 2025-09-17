import { EmailService } from './email-service.js';
import { TranscriptService } from './transcript-service.js';
import { MeetingCleanupService } from './meeting-cleanup-service.js';
import { DatabaseAgent } from '#database/database-agent.js';

// Refactored meeting service - coordination layer for meeting operations
export class MeetingService {
  constructor(dependencies) {
    this.pool = dependencies.pool; // Keep for sub-services
    this.dbAgent = new DatabaseAgent();
    this.dbAgentConnected = false;
    this.meetingLastActivity = dependencies.meetingLastActivity || new Map();
    this.getEmailTransporter = dependencies.getEmailTransporter;
    
    // Initialize sub-services
    this.emailService = new EmailService(this.pool, this.getEmailTransporter);
    this.transcriptService = new TranscriptService(this.pool);
    this.cleanupService = new MeetingCleanupService(
      this.pool, 
      this.meetingLastActivity, 
      this.transcriptService
    );
    
    // Expose buffers for backward compatibility
    const buffers = this.transcriptService.getBuffers();
    this.meetingBuffers = buffers.meetingBuffers;
  }

  // Initialize agent classes (called from server startup)
  setAgentClasses(TranscriptBufferAgent, TurnEmbeddingAgent, embeddingAgent) {
    this.transcriptService.setAgentClasses(
      TranscriptBufferAgent, 
      TurnEmbeddingAgent, 
      embeddingAgent
    );
  }

  // Simple conversation timeline helper
  async appendToConversation(meetingId, content) {
    try {
      // Ensure DatabaseAgent is connected
      if (!this.dbAgentConnected) {
        await this.dbAgent.connect();
        this.dbAgentConnected = true;
      }
      
      // Get current transcript using DatabaseAgent
      const meeting = await this.dbAgent.meetings.getById(meetingId);
      
      if (!meeting) {
        console.error(`❌ Meeting not found: ${meetingId}`);
        return false;
      }
      
      // Build transcript array
      let transcript = meeting.full_transcript || [];
      if (!Array.isArray(transcript)) {
        // If it's not an array, convert it to one
        transcript = [];
      }
      
      // Add new entry with timestamp
      transcript.push({
        timestamp: new Date().toISOString(),
        content: content
      });
      
      // Update the database using DatabaseAgent connector query method
      await this.dbAgent.connector.query(
        'UPDATE meetings.meetings SET full_transcript = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(transcript), meetingId]
      );
      
      console.log(`✅ Added to conversation for meeting ${meetingId}: ${content.substring(0, 100)}...`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error appending to conversation for meeting ${meetingId}:`, error);
      return false;
    }
  }

  // Delegate transcript processing to transcript service
  async processTranscriptChunk(meeting, speakerName, text) {
    return await this.transcriptService.processTranscriptChunk(meeting, speakerName, text);
  }

  // Delegate transcript processing end to transcript service
  async endMeetingTranscriptProcessing(meetingId) {
    return await this.transcriptService.endMeetingTranscriptProcessing(meetingId);
  }

  // Delegate meeting completion to cleanup service
  async completeMeetingByInactivity(botId, reason = 'inactivity') {
    return await this.cleanupService.completeMeetingByInactivity(botId, reason);
  }

  // Delegate email sending to email service
  async sendTranscriptEmail(meetingId, meeting) {
    return await this.emailService.sendTranscriptEmail(meetingId, meeting);
  }

  // Delegate cleanup to cleanup service
  async cleanupInactiveMeetings() {
    return await this.cleanupService.cleanupInactiveMeetings();
  }
}