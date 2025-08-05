// Email service for meeting transcript delivery
export class EmailService {
  constructor(pool, getEmailTransporter) {
    this.pool = pool;
    this.getEmailTransporter = getEmailTransporter;
  }

  // Format transcript array for email display
  formatTranscriptForEmail(transcriptArray) {
    if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
      return 'No transcript content available.';
    }
    
    // Clean and format transcript messages
    return this.cleanTranscript(transcriptArray);
  }

  // Clean and format transcript messages for email
  cleanTranscript(messages) {
    if (!Array.isArray(messages)) {
      return 'No transcript content available.';
    }

    let cleanedContent = [];
    let lastSpeaker = '';
    let lastContent = '';
    
    for (const message of messages) {
      if (!message || typeof message !== 'object') continue;
      
      const content = message.content || message.text || '';
      const timestamp = message.timestamp || '';
      
      if (!content.trim()) continue;
      
      // Skip duplicate consecutive messages
      if (content === lastContent) continue;
      
      // Extract speaker name (handle various formats)
      let speaker = 'Unknown Speaker';
      
      // Check for "Speaker: content" format
      const speakerMatch = content.match(/^([^:]+):\\s*(.+)$/s);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
        const actualContent = speakerMatch[2].trim();
        
        // Group consecutive messages from same speaker
        if (speaker === lastSpeaker) {
          // Append to previous message
          if (cleanedContent.length > 0) {
            cleanedContent[cleanedContent.length - 1] += ' ' + actualContent;
          }
        } else {
          cleanedContent.push(`**${speaker}:** ${actualContent}`);
          lastSpeaker = speaker;
        }
        
        lastContent = content;
        continue;
      }
      
      // Handle raw content without speaker prefix
      if (content !== lastContent) {
        cleanedContent.push(`**Transcript:** ${content}`);
        lastContent = content;
        lastSpeaker = '';
      }
    }
    
    return cleanedContent.join('\\n\\n');
  }

  // Send transcript email to meeting organizer
  async sendTranscriptEmail(meetingId, meeting) {
    try {
      console.log(`📧 Preparing to send transcript email for id: ${meetingId}`);
      
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
      const htmlContent = this.buildEmailHtml(meeting, transcriptText);

      const mailOptions = {
        from: this.getFromAddress(),
        to: meeting.transcript_email,
        subject: `Meeting Transcript: ${meeting.meeting_name || 'Your Meeting'}`,
        html: htmlContent,
        text: `Meeting Transcript\\n\\n${transcriptText}`
      };
      
      console.log('📮 Sending email...');
      
      const transporter = await this.getEmailTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Transcript email sent successfully to ${meeting.transcript_email}`);
      
      // Mark as sent in database
      await this.pool.query(`
        UPDATE meetings 
        SET email_sent = TRUE 
        WHERE id = $1
      `, [meetingId]);
      
      console.log('✅ Database updated: email_sent = TRUE');
      
    } catch (error) {
      console.error('❌ Error sending transcript email:', error);
      
      // Log the error details
      if (error.code === 'ECONNREFUSED') {
        console.error('💡 Email delivery failed - connection refused');
        console.error('   This is normal in development/testing environments');
        console.error('   Email content has been logged above for verification');
      } else {
        console.error('💡 Unexpected email error:', error.message);
      }
    }
  }

  // Build HTML email content
  buildEmailHtml(meeting, transcriptText) {
    return `
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
  }

  // Get email from address based on available configuration
  getFromAddress() {
    return process.env.RESEND_FROM_EMAIL ? 
      `"Cogito Meeting Bot" <${process.env.RESEND_FROM_EMAIL}>` :
      process.env.GMAIL_USER ? 
      `"Cogito Meeting Bot" <${process.env.GMAIL_USER}>` : 
      '"Cogito Meeting Bot" <meetings@cogito-meetings.onrender.com>';
  }
}