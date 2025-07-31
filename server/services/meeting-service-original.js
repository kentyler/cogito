// Meeting service for transcript processing, cleanup, and email functionality
export class MeetingService {
  constructor(dependencies) {
    this.pool = dependencies.pool;
    this.getEmailTransporter = dependencies.getEmailTransporter;
    this.meetingBuffers = dependencies.meetingBuffers || new Map();
    this.meetingSpeakerAgents = dependencies.meetingSpeakerAgents || new Map();
    this.meetingLastActivity = dependencies.meetingLastActivity || new Map();
    
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

  // Simple conversation timeline helper
  async appendToConversation(meetingId, content) {
    try {
      // Get current transcript
      const currentResult = await this.pool.query(
        'SELECT full_transcript FROM meetings WHERE meeting_id = $1',
        [meetingId]
      );
      
      if (currentResult.rows.length === 0) {
        console.error(`❌ Meeting not found: ${meetingId}`);
        return false;
      }
      
      // Build transcript array
      let transcript = currentResult.rows[0].full_transcript || [];
      if (!Array.isArray(transcript)) {
        // If it's not an array, convert it to one
        transcript = [];
      }
      
      // Add new entry with timestamp
      transcript.push({
        timestamp: new Date().toISOString(),
        content: content
      });
      
      // Update with the new transcript array
      const result = await this.pool.query(
        'UPDATE meetings SET full_transcript = $1 WHERE meeting_id = $2 RETURNING *',
        [JSON.stringify(transcript), meetingId]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error appending to conversation:', error);
      return false;
    }
  }

  // Transcript processing helper functions
  async processTranscriptChunk(meeting, speakerName, text) {
    const meetingId = meeting.meeting_id;
    
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
        meetingId: meeting.meeting_id,
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

  // Complete meeting due to inactivity or abandonment
  async completeMeetingByInactivity(botId, reason = 'inactivity') {
    try {
      console.log(`⏰ Completing meeting ${botId} due to ${reason}`);
      
      // Get meeting info
      const meetingResult = await this.pool.query(
        'SELECT * FROM meetings WHERE recall_bot_id = $1 AND status NOT IN ($2, $3)',
        [botId, 'completed', 'failed']
      );
      
      if (meetingResult.rows.length === 0) {
        console.log(`No active meeting found for bot ${botId}`);
        return;
      }
      
      const meeting = meetingResult.rows[0];
      
      // End transcript processing for this meeting
      await this.endMeetingTranscriptProcessing(meeting.meeting_id);
      
      // Update meeting status 
      await this.pool.query(
        `UPDATE meetings 
         SET status = $1, ended_at = NOW()
         WHERE recall_bot_id = $2`,
        ['completed', botId]
      );
      
      // Append completion info to transcript
      await this.appendToConversation(meeting.meeting_id, `[System] Meeting ended: ${reason}`);
      
      console.log(`✅ Meeting ${botId} completed due to ${reason}`);
      
      // Clean up tracking data
      this.meetingLastActivity.delete(botId);
      
      // Send email transcript
      if (meeting.transcript_email && meeting.full_transcript) {
        try {
          await this.sendTranscriptEmail(meeting.meeting_id, meeting);
          console.log(`✅ Transcript email sent to: ${meeting.transcript_email}`);
        } catch (error) {
          console.error(`❌ Failed to send transcript email:`, error);
        }
      } else {
        console.log(`📧 No email sent - missing email (${!!meeting.transcript_email}) or transcript (${!!meeting.full_transcript})`);
      }
      
      return meeting;
      
    } catch (error) {
      console.error(`❌ Error completing meeting ${botId}:`, error);
    }
  }

  // Advanced transcript cleaning function (moved from clean-meeting-47-transcript-v2.js)
  cleanTranscript(messages) {
    let cleanedSections = [];
    let currentSpeaker = null;
    let currentText = '';
    
    messages.forEach((message, index) => {
      let speaker = message.speaker || 'Unknown';
      let text = message.content || message.text || '';
      
      // Skip empty messages
      if (!text.trim()) return;
      
      // Clean up speaker names
      speaker = speaker.trim();
      
      // Check if the text contains bracketed speaker names like [Ian Palonis]
      const bracketMatch = text.match(/^\[([^\]]+)\]\s*/);
      if (bracketMatch) {
        // Extract the speaker from brackets
        speaker = bracketMatch[1].trim();
        // Remove the bracketed name from the text
        text = text.substring(bracketMatch[0].length).trim();
      }
      
      // Look for speaker identification patterns in the remaining text
      const speakerPatterns = [
        /^(?:This is|this is)\s+([A-Z][a-z]+)\b/,
        /^(?:It's|it's)\s+([A-Z][a-z]+)\b/
      ];
      
      let textWithoutSpeaker = text;
      let identifiedSpeaker = null;
      
      // Try to find speaker announcement in the text
      for (let pattern of speakerPatterns) {
        const match = text.match(pattern);
        if (match) {
          let name = match[1];
          
          // Fix common transcription errors
          if (name.toLowerCase() === 'skin') name = 'Ken';
          
          identifiedSpeaker = name;
          
          // Remove the speaker identification from the beginning
          textWithoutSpeaker = text.replace(pattern, '').trim();
          break;
        }
      }
      
      // Use identified speaker if found, otherwise use the speaker from brackets or message
      const finalSpeaker = identifiedSpeaker || speaker;
      
      // Clean up the text
      textWithoutSpeaker = textWithoutSpeaker.trim();
      
      // Capitalize first letter if needed
      if (textWithoutSpeaker.length > 0 && /^[a-z]/.test(textWithoutSpeaker)) {
        textWithoutSpeaker = textWithoutSpeaker.charAt(0).toUpperCase() + textWithoutSpeaker.slice(1);
      }
      
      // Check if speaker changed
      if (currentSpeaker !== finalSpeaker) {
        // Save the previous speaker's text if any
        if (currentSpeaker && currentText) {
          cleanedSections.push(`${currentSpeaker}: ${currentText}`);
        }
        // Start new speaker
        currentSpeaker = finalSpeaker;
        currentText = textWithoutSpeaker;
      } else {
        // Same speaker, append text
        if (currentText && textWithoutSpeaker) {
          currentText += ' ' + textWithoutSpeaker;
        } else if (textWithoutSpeaker) {
          currentText = textWithoutSpeaker;
        }
      }
      
      // Handle last message
      if (index === messages.length - 1 && currentText) {
        cleanedSections.push(`${currentSpeaker}: ${currentText}`);
      }
    });
    
    // Join with double newlines for paragraph breaks
    return cleanedSections.join('\n\n');
  }

  // Format transcript for email with smart speaker grouping (legacy function)
  formatTranscriptForEmail(transcriptArray) {
    if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
      return 'No transcript content available.';
    }
    
    // Use the advanced cleaning function
    return this.cleanTranscript(transcriptArray);
  }

  // Send transcript email function
  async sendTranscriptEmail(meetingId, meeting) {
    try {
      console.log(`📧 Preparing to send transcript email for meeting_id: ${meetingId}`);
      
      if (!meeting.transcript_email) {
        console.error('❌ No email address configured for this meeting');
        return;
      }
      
      if (meeting.email_sent) {
        console.log(`⚠️  Email already sent to ${meeting.transcript_email}`);
        return;
      }
      
      // Get the transcript text with smart speaker formatting
      let transcriptText = 'No transcript content available.';
      if (Array.isArray(meeting.full_transcript) && meeting.full_transcript.length > 0) {
        transcriptText = this.formatTranscriptForEmail(meeting.full_transcript);
      }
      
      // Format transcript for email
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .transcript { background-color: #f9f9f9; padding: 20px; border-left: 4px solid #4CAF50; white-space: pre-wrap; font-family: 'Courier New', monospace; }
        .footer { margin-top: 20px; padding: 20px; background-color: #f0f0f0; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Meeting Transcript</h2>
            <p><strong>Meeting:</strong> ${meeting.meeting_name || 'Untitled Meeting'}</p>
            <p><strong>Date:</strong> ${new Date(meeting.started_at || meeting.created_at).toLocaleString()}</p>
            <p><strong>Meeting URL:</strong> <a href="${meeting.meeting_url}">${meeting.meeting_url}</a></p>
        </div>
        
        <div class="transcript">
${transcriptText}
        </div>
        
        <div class="footer">
            <p>This transcript was automatically generated by Cogito Meeting Bot.</p>
            <p>Thank you for using our service!</p>
        </div>
    </div>
</body>
</html>
`;

      const mailOptions = {
        from: process.env.RESEND_FROM_EMAIL ? 
          `"Cogito Meeting Bot" <${process.env.RESEND_FROM_EMAIL}>` :
          process.env.GMAIL_USER ? 
          `"Cogito Meeting Bot" <${process.env.GMAIL_USER}>` : 
          '"Cogito Meeting Bot" <meetings@cogito-meetings.onrender.com>',
        to: meeting.transcript_email,
        subject: `Meeting Transcript: ${meeting.meeting_name || 'Your Meeting'}`,
        html: htmlContent,
        text: `Meeting Transcript\n\n${transcriptText}`
      };
      
      console.log('📮 Sending email...');
      
      const transporter = await this.getEmailTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Transcript email sent successfully to ${meeting.transcript_email}`);
      
      // Mark as sent in database
      await this.pool.query(`
        UPDATE meetings 
        SET email_sent = TRUE 
        WHERE meeting_id = $1
      `, [meetingId]);
      
      console.log('✅ Database updated: email_sent = TRUE');
      
    } catch (error) {
      console.error('❌ Error sending transcript email:', error);
      
      // Log the error details
      if (error.code === 'ECONNREFUSED') {
        console.error('💡 Email delivery failed - connection refused');
        console.error('   This is normal in development/testing environments');
        console.error('   Email content has been logged above for verification');
      }
      throw error;
    }
  }

  // Periodic cleanup of inactive meetings
  async cleanupInactiveMeetings() {
    try {
      const now = Date.now();
      const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
      const MAXIMUM_MEETING_DURATION = 4 * 60 * 60 * 1000; // 4 hours max
      
      console.log('🧹 Running meeting cleanup...');
      
      // Check for inactive meetings based on last activity
      for (const [botId, lastActivity] of this.meetingLastActivity.entries()) {
        const timeSinceActivity = now - lastActivity;
        
        if (timeSinceActivity > INACTIVITY_TIMEOUT) {
          console.log(`⏰ Meeting ${botId} inactive for ${Math.floor(timeSinceActivity/1000/60)} minutes`);
          await this.completeMeetingByInactivity(botId, 'inactivity_timeout');
        }
      }
      
      // Check database for meetings that are stuck in joining/active status for too long
      const stuckMeetingsResult = await this.pool.query(`
        SELECT recall_bot_id, name as meeting_name, created_at, status
        FROM meetings
        WHERE status IN ('joining', 'active') 
          AND created_at < NOW() - INTERVAL '4 hours'
          AND meeting_type != 'system'
      `);
      
      for (const meeting of stuckMeetingsResult.rows) {
        console.log(`🕘 Found stuck meeting: ${meeting.recall_bot_id} (${meeting.status}) from ${meeting.created_at}`);
        await this.completeMeetingByInactivity(meeting.recall_bot_id, 'maximum_duration_exceeded');
      }
      
      // Clean up memory for completed meetings
      const activeMeetings = await this.pool.query(`
        SELECT recall_bot_id FROM meetings
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
      const activeMeetingIds = new Set();
      for (const meeting of activeMeetings.rows) {
        // Get meeting_id for active meetings
        const meetingDetails = await this.pool.query(
          'SELECT meeting_id FROM meetings WHERE recall_bot_id = $1',
          [meeting.recall_bot_id]
        );
        if (meetingDetails.rows.length > 0) {
          activeMeetingIds.add(meetingDetails.rows[0].meeting_id);
        }
      }
      
      // Remove buffers for completed meetings
      for (const meetingId of this.meetingBuffers.keys()) {
        if (!activeMeetingIds.has(meetingId)) {
          await this.endMeetingTranscriptProcessing(meetingId);
        }
      }
      
      console.log(`✅ Cleanup complete. Tracking ${this.meetingLastActivity.size} active meetings`);
      
    } catch (error) {
      console.error('❌ Error during meeting cleanup:', error);
    }
  }
}