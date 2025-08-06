import pg from 'pg';
import fs from 'fs';
const { Pool } = pg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function rebuildMissingTranscripts() {
  try {
    console.log('=== REBUILDING MISSING TRANSCRIPTS ===\n');
    
    // Find all meetings with turns but no/minimal transcript
    const meetings = await pool.query(`
      WITH meeting_turn_counts AS (
        SELECT 
          m.id,
          m.name,
          m.meeting_type,
          m.status,
          m.created_at,
          COUNT(t.id) as turn_count
        FROM meetings.meetings m
        JOIN meetings.turns t ON t.meeting_id = m.id
        WHERE m.full_transcript IS NULL OR LENGTH(m.full_transcript::text) < 100
        GROUP BY m.id, m.name, m.meeting_type, m.status, m.created_at
        HAVING COUNT(t.id) > 0
      )
      SELECT * 
      FROM meeting_turn_counts
      ORDER BY turn_count DESC
    `);
    
    console.log(`Found ${meetings.rows.length} meetings to rebuild\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each meeting
    for (const [index, meeting] of meetings.rows.entries()) {
      console.log(`[${index + 1}/${meetings.rows.length}] Processing: ${meeting.name || 'Unnamed'} (${meeting.turn_count} turns)`);
      
      try {
        // Get all turns for this meeting
        const turns = await pool.query(`
          SELECT id, content, timestamp, metadata, source_type
          FROM meetings.turns
          WHERE meeting_id = $1
          ORDER BY timestamp ASC, id ASC
        `, [meeting.id]);
        
        // Build transcript
        let transcript = '';
        let lastSpeaker = null;
        
        turns.rows.forEach((turn) => {
          const speaker = turn.metadata?.speaker || 
                         turn.metadata?.speaker_label || 
                         turn.metadata?.name || 
                         turn.metadata?.user_name ||
                         'Unknown';
          
          const timestamp = new Date(turn.timestamp);
          const timeStr = timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
          
          // Only add speaker label if it changed
          if (speaker !== lastSpeaker) {
            transcript += `\n[${speaker} - ${timeStr}]:\n`;
            lastSpeaker = speaker;
          }
          
          transcript += `${turn.content}\n`;
        });
        
        // Update the meeting with the rebuilt transcript
        await pool.query(`
          UPDATE meetings.meetings
          SET full_transcript = $1::jsonb,
              updated_at = NOW()
          WHERE id = $2
        `, [JSON.stringify(transcript), meeting.id]);
        
        console.log(`✅ Success: Rebuilt ${transcript.length} chars from ${turns.rows.length} turns`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
        errors.push({ meeting: meeting.name || meeting.id, error: error.message });
      }
    }
    
    // Summary report
    console.log('\n=== REBUILD SUMMARY ===');
    console.log(`Total meetings processed: ${meetings.rows.length}`);
    console.log(`✅ Successfully rebuilt: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach(e => {
        console.log(`- ${e.meeting}: ${e.error}`);
      });
    }
    
    // Save summary to file
    const summary = {
      timestamp: new Date().toISOString(),
      total_meetings: meetings.rows.length,
      success_count: successCount,
      error_count: errorCount,
      errors: errors,
      meetings_processed: meetings.rows.map(m => ({
        id: m.id,
        name: m.name,
        turn_count: m.turn_count,
        type: m.meeting_type
      }))
    };
    
    fs.writeFileSync('transcript-rebuild-summary.json', JSON.stringify(summary, null, 2));
    console.log('\nSummary saved to: transcript-rebuild-summary.json');
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  rebuildMissingTranscripts();
}

export { rebuildMissingTranscripts };