import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Generate a brief summary from transcript content
function generateSummary(transcript, meetingName, meetingType) {
  if (!transcript) return null;
  
  // Convert JSONB to string if needed
  const text = typeof transcript === 'string' ? transcript : JSON.stringify(transcript);
  
  // Extract key information for summary
  const lines = text.split('\n').filter(line => line.trim());
  
  // Find speakers
  const speakers = new Set();
  const speakerRegex = /\[([^\]]+) - \d{2}:\d{2}:\d{2} [AP]M\]:/;
  lines.forEach(line => {
    const match = line.match(speakerRegex);
    if (match) speakers.add(match[1]);
  });
  
  // Get first few substantive lines (skip speaker labels)
  const contentLines = lines.filter(line => !speakerRegex.test(line) && line.length > 20);
  const firstContent = contentLines.slice(0, 5).join(' ').substring(0, 300);
  
  // Identify key topics by looking for common technical terms
  const topics = [];
  const techTerms = {
    'database': 'database/SQL',
    'sql': 'database/SQL',
    'postgres': 'PostgreSQL',
    'meeting': 'meeting coordination',
    'transcript': 'transcript processing',
    'code': 'coding/development',
    'function': 'coding/development',
    'component': 'UI/components',
    'react': 'React development',
    'api': 'API development',
    'test': 'testing',
    'error': 'debugging',
    'bug': 'debugging',
    'deploy': 'deployment',
    'git': 'version control',
    'commit': 'version control',
    'conflict': 'conflict resolution',
    'pattern': 'pattern recognition',
    'claude': 'AI/Claude interaction',
    'ai': 'AI discussion',
    'design': 'design discussion',
    'user': 'user management',
    'auth': 'authentication',
    'session': 'session management'
  };
  
  const lowerText = text.toLowerCase();
  Object.entries(techTerms).forEach(([term, topic]) => {
    if (lowerText.includes(term) && !topics.includes(topic)) {
      topics.push(topic);
    }
  });
  
  // Build summary
  let summary = '';
  
  // Add participant info
  if (speakers.size > 0) {
    const speakerList = Array.from(speakers).slice(0, 5);
    summary += `Participants: ${speakerList.join(', ')}`;
    if (speakers.size > 5) summary += ` and ${speakers.size - 5} others`;
    summary += '. ';
  }
  
  // Add topics if found
  if (topics.length > 0) {
    summary += `Topics: ${topics.slice(0, 5).join(', ')}. `;
  }
  
  // Add snippet of content
  if (firstContent.trim()) {
    summary += `Content preview: "${firstContent.trim()}..."`;
  }
  
  // If summary is too short, add more context
  if (summary.length < 50 && contentLines.length > 0) {
    summary = `${meetingType || 'Session'} with ${lines.length} lines of content. Preview: "${contentLines[0].substring(0, 150)}..."`;
  }
  
  return summary || `${meetingType || 'Meeting'} transcript with ${lines.length} lines`;
}

async function generateAllSummaries() {
  try {
    console.log('=== GENERATING TRANSCRIPT SUMMARIES ===\n');
    
    // Get all meetings with transcripts but no summary
    const meetings = await pool.query(`
      SELECT id, name, meeting_type, full_transcript,
             LENGTH(full_transcript::text) as transcript_length
      FROM meetings.meetings
      WHERE full_transcript IS NOT NULL 
        AND LENGTH(full_transcript::text) > 100
        AND transcript_summary IS NULL
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${meetings.rows.length} meetings needing summaries\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each meeting
    for (const [index, meeting] of meetings.rows.entries()) {
      console.log(`[${index + 1}/${meetings.rows.length}] Processing: ${meeting.name || 'Unnamed'}`);
      
      try {
        // Generate summary
        const summary = generateSummary(
          meeting.full_transcript, 
          meeting.name, 
          meeting.meeting_type
        );
        
        if (summary) {
          // Update the meeting with the summary
          await pool.query(`
            UPDATE meetings.meetings
            SET transcript_summary = $1,
                updated_at = NOW()
            WHERE id = $2
          `, [summary, meeting.id]);
          
          console.log(`✅ Generated summary: ${summary.substring(0, 80)}...`);
          successCount++;
        } else {
          console.log(`⚠️  Could not generate summary`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
        errors.push({ meeting: meeting.name || meeting.id, error: error.message });
      }
    }
    
    // Also generate summaries for meetings with generic names
    console.log('\n=== CHECKING MEETINGS WITH GENERIC NAMES ===');
    
    const genericMeetings = await pool.query(`
      SELECT id, name, meeting_type, full_transcript
      FROM meetings.meetings
      WHERE full_transcript IS NOT NULL 
        AND LENGTH(full_transcript::text) > 100
        AND transcript_summary IS NULL
        AND (
          name LIKE 'Google Meet%'
          OR name LIKE 'Zoom Meeting%'
          OR name LIKE 'Web Session%'
          OR name LIKE 'Session:%'
          OR name IS NULL
        )
    `);
    
    console.log(`Found ${genericMeetings.rows.length} additional meetings with generic names\n`);
    
    for (const meeting of genericMeetings.rows) {
      try {
        const summary = generateSummary(
          meeting.full_transcript, 
          meeting.name, 
          meeting.meeting_type
        );
        
        if (summary) {
          await pool.query(`
            UPDATE meetings.meetings
            SET transcript_summary = $1,
                updated_at = NOW()
            WHERE id = $2
          `, [summary, meeting.id]);
          successCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }
    
    // Summary report
    console.log('\n=== SUMMARY GENERATION COMPLETE ===');
    console.log(`Total meetings processed: ${meetings.rows.length + genericMeetings.rows.length}`);
    console.log(`✅ Successfully generated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      total_processed: meetings.rows.length + genericMeetings.rows.length,
      success_count: successCount,
      error_count: errorCount,
      errors: errors
    };
    
    fs.writeFileSync('summary-generation-report.json', JSON.stringify(report, null, 2));
    console.log('\nReport saved to: summary-generation-report.json');
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  generateAllSummaries();
}

export { generateAllSummaries };