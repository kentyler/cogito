// Meeting cleanup service for handling inactive meetings and memory management
export class MeetingCleanupService {
  constructor(pool, meetingLastActivity, transcriptService) {
    this.pool = pool;
    this.meetingLastActivity = meetingLastActivity;
    this.transcriptService = transcriptService;
    
    // Configuration
    this.INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    this.MAXIMUM_MEETING_DURATION = 4 * 60 * 60 * 1000; // 4 hours max
  }

  // Complete meeting due to inactivity or abandonment
  async completeMeetingByInactivity(botId, reason = 'inactivity') {
    try {
      console.log(`⏰ Completing meeting ${botId} due to ${reason}`);
      
      // Get meeting info
      const meetingResult = await this.pool.query(
        'SELECT * FROM meetings.meetings WHERE recall_bot_id = $1 AND status NOT IN ($2, $3)',
        [botId, 'completed', 'inactive']
      );
      
      if (meetingResult.rows.length === 0) {
        console.log(`ℹ️ Meeting ${botId} not found or already completed`);
        return;
      }
      
      const meeting = meetingResult.rows[0];
      console.log(`📋 Found meeting: ${meeting.name} (status: ${meeting.status})`);
      
      // End transcript processing first
      if (this.transcriptService) {
        await this.transcriptService.endMeetingTranscriptProcessing(meeting.id);
      }
      
      // Update meeting status to completed
      await this.pool.query(`
        UPDATE meetings.meetings 
        SET status = 'completed',
            ended_at = NOW(),
            updated_at = NOW()
        WHERE recall_bot_id = $1
      `, [botId]);
      
      console.log(`✅ Meeting ${botId} marked as completed in database`);
      
      // Send transcript email if configured
      if (meeting.transcript_email && !meeting.email_sent) {
        console.log(`📧 Meeting has email configured: ${meeting.transcript_email}`);
        
        // Get updated meeting data with full transcript
        const updatedMeetingResult = await this.pool.query(
          'SELECT * FROM meetings.meetings WHERE id = $1',
          [meeting.id]
        );
        
        if (updatedMeetingResult.rows.length > 0) {
          const updatedMeeting = updatedMeetingResult.rows[0];
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
      const stuckMeetingsResult = await this.pool.query(`
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
    // Get active meetings from database
    const activeMeetings = await this.pool.query(`
      SELECT recall_bot_id FROM meetings.meetings
      WHERE status IN ('joining', 'active') AND meeting_type != 'system'
    `);
    
    const activeBotIds = new Set(activeMeetings.rows.map(m => m.recall_bot_id));
    
    // Remove tracking data for completed meetings
    for (const botId of this.meetingLastActivity.keys()) {
      if (!activeBotIds.has(botId)) {
        this.meetingLastActivity.delete(botId);
      }
    }
    
    // Clean up transcript buffers for completed meetings
    if (this.transcriptService) {
      const activeMeetingIds = new Set();
      for (const meeting of activeMeetings.rows) {
        // Get meeting_id for active meetings
        const meetingDetails = await this.pool.query(
          'SELECT id FROM meetings.meetings WHERE recall_bot_id = $1',
          [meeting.recall_bot_id]
        );
        if (meetingDetails.rows.length > 0) {
          activeMeetingIds.add(meetingDetails.rows[0].id);
        }
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