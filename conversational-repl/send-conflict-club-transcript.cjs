const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Format transcript for markdown (handles different transcript formats)
function formatTranscriptForMarkdown(transcriptData) {
  // Handle different transcript formats
  if (!transcriptData) return 'No transcript data available.';
  
  // If it's an object with a 'transcript' property (like some meeting formats)
  if (typeof transcriptData === 'object' && transcriptData.transcript && !Array.isArray(transcriptData)) {
    return transcriptData.transcript;
  }
  
  // If it's an array (like conversational format)
  if (Array.isArray(transcriptData)) {
    let formattedText = '';
    let lastSpeaker = '';
    let currentSpeakerText = '';
    
    const finalizeSpeaker = () => {
      if (currentSpeakerText && lastSpeaker) {
        formattedText += `**${lastSpeaker}:**\n\n${currentSpeakerText}\n\n---\n\n`;
        currentSpeakerText = '';
      }
    };
    
    transcriptData.forEach(entry => {
      const content = entry.content || '';
      if (!content.trim()) return;
      
      // Extract speaker and message from format like "[Speaker Name] message" or "[Speaker Name via chat] message"
      const speakerMatch = content.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (speakerMatch) {
        const speaker = speakerMatch[1].replace(' via chat', '');
        const message = speakerMatch[2].trim();
        
        if (!message || speaker === 'Cogito') return; // Skip empty messages and Cogito
        
        // If speaker changed, finalize previous speaker's text
        if (speaker !== lastSpeaker) {
          finalizeSpeaker();
          lastSpeaker = speaker;
          currentSpeakerText = message;
        } else {
          // Same speaker, add to their current text
          currentSpeakerText += ' ' + message;
        }
      } else if (content.trim()) {
        // Handle content without speaker format
        currentSpeakerText += ' ' + content;
      }
    });
    
    // Finalize last speaker
    finalizeSpeaker();
    
    return formattedText.trim();
  }
  
  // If it's a string
  if (typeof transcriptData === 'string') {
    return transcriptData;
  }
  
  return 'No transcript data available.';
}

// Generate AI meta commentary about the meeting
async function generateMetaCommentary(transcript, meetingName) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return 'AI commentary unavailable - ANTHROPIC_API_KEY not configured';
    }

    const prompt = `Could you help with a 'meta commentary' about the overall meeting. Points you found interesting, ideas that could benefit from future development, things like that.

Meeting: ${meetingName}

Transcript:
${transcript}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('❌ Error generating AI commentary:', error);
    if (error.status === 401) {
      return 'AI commentary unavailable - Invalid or missing ANTHROPIC_API_KEY';
    }
    return `Error generating AI commentary: ${error.message}`;
  }
}

// Truncate text to fit within token limits (rough approximation: 1 token ≈ 4 characters)
function truncateText(text, maxTokens = 8000) {
  const maxChars = maxTokens * 4; // Conservative estimate
  if (text.length <= maxChars) {
    return text;
  }
  
  // Truncate and add indicator
  const truncated = text.substring(0, maxChars - 100);
  return truncated + '\n\n[... transcript truncated due to length ...]';
}

// Generate embedding for transcript
async function generateTranscriptEmbedding(transcript) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OPENAI_API_KEY not configured, skipping embedding generation');
      return null;
    }

    // Truncate if too long
    const truncatedTranscript = truncateText(transcript);
    if (truncatedTranscript !== transcript) {
      console.log(`⚠️ Transcript truncated from ${transcript.length} to ${truncatedTranscript.length} characters for embedding`);
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedTranscript,
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    return null;
  }
}

async function sendTranscriptEmail(meetingId) {
  try {
    if (!meetingId) {
      console.log('❌ Meeting ID required. Usage: node send-conflict-club-transcript.cjs <meeting_id>');
      return;
    }
    
    console.log(`🔍 Looking for meeting with ID ${meetingId}...`);
    
    // Get the meeting by ID
    const result = await pool.query(`
      SELECT 
        id,
        block_id,
        meeting_name,
        meeting_url,
        created_at,
        full_transcript,
        transcript_email
      FROM conversation.block_meetings 
      WHERE id = $1
    `, [meetingId]);
    
    if (result.rows.length === 0) {
      console.log(`❌ No meeting found with ID ${meetingId}`);
      return;
    }
    
    const meeting = result.rows[0];
    console.log('✅ Found meeting:', meeting.meeting_name);
    
    if (!meeting.full_transcript) {
      console.log('❌ Meeting has no transcript data');
      return;
    }
    
    // Format transcript (it's already an array/object from JSONB column)
    const transcript = meeting.full_transcript;
    const formattedTranscript = formatTranscriptForMarkdown(transcript);
    
    if (!formattedTranscript) {
      console.log('❌ No readable transcript content');
      return;
    }
    
    console.log('📝 Transcript formatted, length:', formattedTranscript.length, 'characters');
    
    // Generate AI meta commentary
    console.log('🤖 Generating AI meta commentary...');
    const aiCommentary = await generateMetaCommentary(formattedTranscript, meeting.meeting_name);
    console.log('✅ AI commentary generated, length:', aiCommentary.length, 'characters');
    
    // Generate embedding for the transcript
    console.log('🔍 Generating transcript embedding...');
    const embedding = await generateTranscriptEmbedding(formattedTranscript);
    if (embedding) {
      console.log('✅ Embedding generated, dimensions:', embedding.length);
      
      // Update the database with the embedding
      await pool.query(`
        UPDATE conversation.block_meetings 
        SET full_transcript_embedding = $1 
        WHERE id = $2
      `, [JSON.stringify(embedding), meetingId]);
      console.log('✅ Embedding saved to database');
    } else {
      console.log('⚠️ Embedding generation skipped');
    }
    
    // Setup Resend transporter
    if (!process.env.RESEND_API_KEY) {
      console.log('❌ RESEND_API_KEY not configured');
      return;
    }
    
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
    console.log('✅ Resend connection verified');
    
    // Create email content
    const meetingDate = new Date(meeting.created_at).toLocaleDateString();
    const meetingTime = new Date(meeting.created_at).toLocaleTimeString();
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Conflict Club Meeting Transcript</title>
  <style>
    body { 
      font-family: 'Georgia', serif; 
      line-height: 1.8; 
      color: #333; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
      background: #fafafa;
    }
    .header { 
      background: #ffffff; 
      padding: 30px; 
      border-radius: 8px; 
      margin-bottom: 30px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .transcript { 
      background: white; 
      padding: 30px; 
      border-radius: 8px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .speaker { 
      font-weight: bold; 
      color: #2c5aa0; 
      font-size: 1.1em;
      margin-top: 2em; 
      margin-bottom: 0.5em;
      padding-bottom: 0.5em;
      border-bottom: 2px solid #e8f4fd;
    }
    .speaker:first-child { margin-top: 0; }
    .message { 
      margin-bottom: 2em; 
      text-align: justify;
      font-size: 1.05em;
    }
    .separator {
      margin: 2em 0;
      border: none;
      border-top: 1px solid #ddd;
      opacity: 0.5;
    }
    h1 { color: #2c5aa0; }
    h2 { color: #2c5aa0; margin-bottom: 1.5em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📝 ${meeting.meeting_name} - Meeting Transcript</h1>
    <p><strong>Date:</strong> ${meetingDate}</p>
    <p><strong>Time:</strong> ${meetingTime}</p>
    <p><strong>Meeting URL:</strong> <a href="${meeting.meeting_url}">${meeting.meeting_url}</a></p>
  </div>
  
  <div class="transcript">
    <h2>Transcript</h2>
    ${formattedTranscript
      .replace(/\*\*(.*?)\*\*/g, '<div class="speaker">$1</div>')
      .replace(/---/g, '<hr class="separator">')
      .replace(/(?<!<\/div>)\n\n(?!<)/g, '</div><div class="message">')
      .replace(/^(?!<div class="speaker">)(.+)$/gm, '<div class="message">$1</div>')
    }
  </div>
  
  <div class="transcript" style="margin-top: 30px;">
    <h2>🤖 AI Meta Commentary</h2>
    <div style="font-style: italic; color: #555; margin-bottom: 15px;">
      Generated analysis of key themes, insights, and development opportunities from this meeting
    </div>
    <div style="white-space: pre-wrap; line-height: 1.6;">
      ${aiCommentary.replace(/\n/g, '<br>')}
    </div>
  </div>
  
  <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; font-size: 12px; color: #666;">
    <p>This transcript was automatically generated by Cogito AI meeting assistant.</p>
    <p>Generated on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
`;

    const mailOptions = {
      from: `"Cogito Meeting Bot" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: 'ken@8thfold.com',
      subject: `${meeting.meeting_name} - Transcript + AI Analysis - ${meetingDate}`,
      html: htmlContent,
      text: `# ${meeting.meeting_name} - Meeting Transcript

**Date:** ${meetingDate}
**Time:** ${meetingTime}
**Meeting URL:** ${meeting.meeting_url}

---

## Transcript

${formattedTranscript}

---

## 🤖 AI Meta Commentary

*Generated analysis of key themes, insights, and development opportunities from this meeting*

${aiCommentary}

---

*This transcript was automatically generated by Cogito AI meeting assistant.*
*Generated on: ${new Date().toLocaleString()}*`
    };

    console.log('📧 Sending email to ken@8thfold.com...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Error sending transcript email:', error);
  } finally {
    await pool.end();
  }
}

// Get meeting ID from command line arguments
const meetingId = process.argv[2];

// Run the script
sendTranscriptEmail(meetingId);