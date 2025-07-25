const { Pool } = require('pg');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '../conversational-repl/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function sendTestTranscriptEmail() {
  try {
    // Get the meeting
    const result = await pool.query(
      `SELECT * FROM conversation.block_meetings 
       WHERE meeting_url LIKE '%ako-whbk-pbu%' 
       ORDER BY created_at DESC 
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      console.log('No meeting found');
      return;
    }
    
    const meeting = result.rows[0];
    console.log('Found meeting:', meeting.meeting_url);
    console.log('Transcript email:', meeting.transcript_email);
    
    // Format transcript for email with smart speaker grouping
    function formatTranscriptForEmail(transcriptArray) {
      if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
        return 'No transcript content available.';
      }
      
      let formattedText = '';
      let lastSpeaker = '';
      
      for (const entry of transcriptArray) {
        if (!entry.content) continue;
        
        // Extract speaker from content like "[Kenneth Tyler] message"
        const speakerMatch = entry.content.match(/^\[([^\]]+)\]\s*(.*)$/);
        if (speakerMatch) {
          const speaker = speakerMatch[1];
          const message = speakerMatch[2];
          
          // Only add speaker tag if speaker changed
          if (speaker !== lastSpeaker) {
            if (formattedText) formattedText += '\n\n'; // Add space between speakers
            formattedText += `[${speaker}]\n`;
            lastSpeaker = speaker;
          }
          
          // Add the message (with line break if not first message from this speaker)
          if (message.trim()) {
            if (speaker === lastSpeaker && formattedText && !formattedText.endsWith('\n')) {
              formattedText += ' ';
            }
            formattedText += message.trim();
            if (!formattedText.endsWith('\n')) formattedText += '\n';
          }
        } else {
          // Content without speaker format, just add it
          formattedText += entry.content;
          if (!formattedText.endsWith('\n')) formattedText += '\n';
        }
      }
      
      return formattedText.trim();
    }

    // Get transcript text
    let transcriptText = 'No transcript content available.';
    if (Array.isArray(meeting.full_transcript) && meeting.full_transcript.length > 0) {
      transcriptText = formatTranscriptForEmail(meeting.full_transcript);
      console.log('\n📝 Formatted transcript preview:');
      console.log('================================');
      console.log(transcriptText);
      console.log('================================\n');
    }
    
    // Create email transporter with Resend
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Resend SMTP connection verified');
    
    // Format email
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
            <p><strong>Date:</strong> ${new Date(meeting.created_at).toLocaleString()}</p>
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
</html>`;

    const mailOptions = {
      from: `"Cogito Meeting Bot" <${process.env.RESEND_FROM_EMAIL}>`,
      to: meeting.transcript_email,
      subject: `Meeting Transcript: ${meeting.meeting_name || 'Your Meeting'}`,
      html: htmlContent,
      text: `Meeting Transcript\n\n${transcriptText}`
    };
    
    console.log('📮 Sending email...');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    
    const emailResult = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', emailResult.messageId);
    console.log('Accepted:', emailResult.accepted);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  } finally {
    await pool.end();
  }
}

sendTestTranscriptEmail();