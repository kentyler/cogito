const { Pool } = require('pg');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Format transcript for embedding (handles different transcript formats)
function formatTranscriptForMarkdown(transcriptData) {
  // Handle different transcript formats
  if (!transcriptData) return 'No transcript data available.';
  
  // If it's an object with a 'transcript' property (like meeting ID 20)
  if (typeof transcriptData === 'object' && transcriptData.transcript && !Array.isArray(transcriptData)) {
    return transcriptData.transcript;
  }
  
  // If it's an array (like meeting ID 45)
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
      console.log('❌ OPENAI_API_KEY not configured');
      return null;
    }

    // Truncate if too long
    const truncatedTranscript = truncateText(transcript);
    if (truncatedTranscript !== transcript) {
      console.log(`⚠️ Transcript truncated from ${transcript.length} to ${truncatedTranscript.length} characters`);
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

async function generateEmbeddingsForAllMeetings() {
  try {
    console.log('🔍 Finding meetings without embeddings...');
    
    // Get all meetings that have transcripts but no embeddings
    const result = await pool.query(`
      SELECT 
        id,
        meeting_name,
        full_transcript,
        created_at
      FROM conversation.block_meetings 
      WHERE full_transcript IS NOT NULL 
      AND full_transcript_embedding IS NULL
      ORDER BY created_at DESC
    `);
    
    const meetings = result.rows;
    console.log(`📋 Found ${meetings.length} meetings without embeddings`);
    
    if (meetings.length === 0) {
      console.log('✅ All meetings already have embeddings!');
      return;
    }
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (const meeting of meetings) {
      processed++;
      console.log(`\n📝 Processing ${processed}/${meetings.length}: ${meeting.meeting_name} (ID: ${meeting.id})`);
      
      // Format the transcript
      const formattedTranscript = formatTranscriptForMarkdown(meeting.full_transcript);
      
      if (!formattedTranscript || formattedTranscript === 'No transcript data available.') {
        console.log('⚠️ No readable transcript content, skipping');
        continue;
      }
      
      console.log(`📏 Transcript length: ${formattedTranscript.length} characters`);
      
      // Generate embedding
      console.log('🔍 Generating embedding...');
      const embedding = await generateTranscriptEmbedding(formattedTranscript);
      
      if (embedding) {
        console.log(`✅ Embedding generated, dimensions: ${embedding.length}`);
        
        // Update the database with the embedding
        try {
          await pool.query(`
            UPDATE conversation.block_meetings 
            SET full_transcript_embedding = $1 
            WHERE id = $2
          `, [JSON.stringify(embedding), meeting.id]);
          console.log('✅ Embedding saved to database');
          successful++;
        } catch (dbError) {
          console.error('❌ Failed to save embedding to database:', dbError);
          failed++;
        }
      } else {
        console.log('❌ Failed to generate embedding');
        failed++;
      }
      
      // Add a small delay to be respectful to the API
      if (processed < meetings.length) {
        console.log('⏳ Waiting 1 second before next request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Total meetings processed: ${processed}`);
    console.log(`   Successful embeddings: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log('✅ Batch embedding generation complete!');
    
  } catch (error) {
    console.error('❌ Error in batch embedding generation:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
generateEmbeddingsForAllMeetings();