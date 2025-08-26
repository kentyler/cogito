// Meeting cleanup service for handling inactive meetings and memory management
import { DatabaseAgent } from '../../lib/database-agent.js';

export class MeetingCleanupService {
  constructor(pool, meetingLastActivity, transcriptService) {
    this.pool = pool;
    this.meetingLastActivity = meetingLastActivity;
    this.transcriptService = transcriptService;
    this.dbAgent = new DatabaseAgent();
    
    // Configuration
    this.INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    this.MAXIMUM_MEETING_DURATION = 4 * 60 * 60 * 1000; // 4 hours max
  }

  // Complete meeting due to inactivity or abandonment
  async completeMeetingByInactivity(botId, reason = 'inactivity') {
    try {
      console.log(`⏰ Completing meeting ${botId} due to ${reason}`);
      
      // Get meeting info using DatabaseAgent meetings domain
      const meeting = await this.dbAgent.meetings.getByBotId(botId);
      
      if (!meeting) {
        console.log(`ℹ️ Meeting ${botId} not found or already completed`);
        return;
      }
      console.log(`📋 Found meeting: ${meeting.name} (status: ${meeting.status})`);
      
      // End transcript processing first
      if (this.transcriptService) {
        await this.transcriptService.endMeetingTranscriptProcessing(meeting.id);
      }
      
      // Update meeting status to completed using DatabaseAgent
      await this.dbAgent.meetings.updateStatus(botId, 'completed');
      
      console.log(`✅ Meeting ${botId} marked as completed in database`);
      
      // Send transcript email if configured
      if (meeting.transcript_email && !meeting.email_sent) {
        console.log(`📧 Meeting has email configured: ${meeting.transcript_email}`);
        
        // Get updated meeting data with full transcript
        const updatedMeeting = await this.dbAgent.meetings.getById(meeting.id);
        
        if (updatedMeeting) {
          console.log(`📊 Meeting transcript length: ${Array.isArray(updatedMeeting.full_transcript) ? updatedMeeting.full_transcript.length : 'not array'}`);
          
          // Send email via webhook service (if available)
          if (global.webhookService && typeof global.webhookService.sendTranscriptEmail === 'function') {
            await global.webhookService.sendTranscriptEmail(meeting.id, updatedMeeting);
          } else {
            console.log('ℹ️ No webhook service available for email sending');
          }
        }
      }
      
      // Remove from activity tracking
      this.meetingLastActivity.delete(botId);
      
      return meeting;
      
    } catch (error) {
      console.error(`❌ Error completing meeting ${botId}:`, error);
      throw error;
    }
  }

  // Run periodic cleanup of inactive meetings
  async cleanupInactiveMeetings() {
    try {
      const now = Date.now();
      
      console.log('🧹 Running meeting cleanup...');
      
      // Check for inactive meetings based on last activity
      for (const [botId, lastActivity] of this.meetingLastActivity.entries()) {
        const timeSinceActivity = now - lastActivity;
        
        if (timeSinceActivity > this.INACTIVITY_TIMEOUT) {
          console.log(`⏰ Meeting ${botId} inactive for ${Math.floor(timeSinceActivity/1000/60)} minutes`);
          await this.completeMeetingByInactivity(botId, 'inactivity_timeout');
        }
      }
      
      // Check database for meetings that are stuck in joining/active status for too long
      // Only check meetings with recall_bot_id (bot meetings need cleanup, web sessions don't)
      // Note: DatabaseAgent doesn't have a specific method for this query yet,
      // so we use the raw query method temporarily
      await this.dbAgent.connect();
      const stuckMeetingsResult = await this.dbAgent.connector.query(`
        SELECT id, recall_bot_id, name as meeting_name, created_at, status
        FROM meetings.meetings
        WHERE status IN ('joining', 'active') 
          AND created_at < NOW() - INTERVAL '4 hours'
          AND meeting_type != 'system'
          AND recall_bot_id IS NOT NULL
      `);
      
      for (const meeting of stuckMeetingsResult.rows) {
        console.log(`🕘 Found stuck meeting: ${meeting.recall_bot_id} (${meeting.status}) from ${meeting.created_at}`);
        await this.completeMeetingByInactivity(meeting.recall_bot_id, 'maximum_duration_exceeded');
      }
      
      // Clean up memory for completed meetings
      await this.cleanupMemoryBuffers();
      
      console.log(`✅ Cleanup complete. Tracking ${this.meetingLastActivity.size} active meetings`);
      
    } catch (error) {
      console.error('❌ Error during meeting cleanup:', error);
    }
  }

  // Clean up memory buffers for completed meetings
  async cleanupMemoryBuffers() {
    // Get active meetings from database using meeting operations
    const activeMeetings = await this.dbAgent.meetings.getActiveMeetings();
    
    const activeBotIds = new Set(activeMeetings.map(m => m.recall_bot_id));
    
    // Remove tracking data for completed meetings
    for (const botId of this.meetingLastActivity.keys()) {
      if (!activeBotIds.has(botId)) {
        this.meetingLastActivity.delete(botId);
      }
    }
    
    // Clean up transcript buffers for completed meetings
    if (this.transcriptService) {
      const activeMeetingIds = new Set();
      for (const meeting of activeMeetings) {
        // Meeting ID is already available from getActiveMeetings
        activeMeetingIds.add(meeting.id);
      }
      
      // Remove buffers for completed meetings
      const { meetingBuffers } = this.transcriptService.getBuffers();
      for (const meetingId of meetingBuffers.keys()) {
        if (!activeMeetingIds.has(meetingId)) {
          await this.transcriptService.endMeetingTranscriptProcessing(meetingId);
        }
      }
    }
  }
}