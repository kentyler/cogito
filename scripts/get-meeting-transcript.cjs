const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Retrieves complete meeting transcript and metadata using stored procedures
 * @param {string} meetingUrl - The Google Meet URL
 * @returns {Promise<Object>} Meeting data with transcript
 */
async function getMeetingTranscript(meetingUrl) {
  try {
    // Get meeting stats using stored procedure
    const statsResult = await pool.query(
      "SELECT * FROM get_meeting_stats($1)",
      [meetingUrl]
    );
    
    const stats = statsResult.rows[0];
    if (!stats.meeting_found) {
      return { 
        found: false, 
        message: `No meeting found with URL: ${meetingUrl}` 
      };
    }
    
    // Get basic meeting info (since full transcript function has issues)
    const meetingResult = await pool.query(
      "SELECT bm.*, b.name as block_name " +
      "FROM conversation.block_meetings bm " +
      "LEFT JOIN conversation.blocks b ON bm.block_id = b.block_id " +
      "WHERE bm.meeting_url = $1",
      [meetingUrl]
    );
    
    const meeting = meetingResult.rows[0];
    
    // Get transcript manually for now
    const turnsResult = await pool.query(
      "SELECT t.*, bt.sequence_order, p.name as participant_name " +
      "FROM conversation.turns t " +
      "JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id " +
      "LEFT JOIN conversation.participants p ON t.participant_id = p.id " +
      "WHERE bt.block_id = $1 " +
      "ORDER BY bt.sequence_order, t.timestamp",
      [meeting.block_id]
    );
    
    // Format the turns for display
    const transcript = turnsResult.rows.map(turn => ({
      timestamp: turn.timestamp,
      speaker: turn.participant_name || 'Unknown',
      content: turn.content,
      source_type: turn.source_type,
      sequence_order: turn.sequence_order
    }));
    
    return {
      found: true,
      meeting: {
        id: meeting.id,
        name: meeting.meeting_name,
        url: meeting.meeting_url,
        status: meeting.status,
        block_id: meeting.block_id,
        block_name: meeting.block_name
      },
      transcript,
      stats: {
        total_turns: stats.total_turns,
        speakers: stats.speaker_list || [],
        unique_speakers: stats.unique_speakers,
        duration_minutes: stats.duration_minutes,
        meeting_status: stats.meeting_status
      }
    };
    
  } catch (err) {
    return {
      found: false,
      error: err.message,
      stack: err.stack
    };
  }
}

/**
 * Pretty prints a meeting transcript to console
 */
function printTranscript(meetingData) {
  if (!meetingData.found) {
    console.log('❌', meetingData.message || meetingData.error);
    return;
  }
  
  const { meeting, transcript, stats } = meetingData;
  
  console.log('\n📋 MEETING TRANSCRIPT');
  console.log('=====================================');
  console.log(`Meeting: ${meeting.name || 'Unnamed'}`);
  console.log(`Status: ${meeting.status}`);
  console.log(`URL: ${meeting.url}`);
  if (meeting.start_time) {
    console.log(`Start: ${new Date(meeting.start_time).toLocaleString()}`);
  }
  if (meeting.end_time) {
    console.log(`End: ${new Date(meeting.end_time).toLocaleString()}`);
  }
  console.log(`Block ID: ${meeting.block_id}`);
  console.log(`Total Turns: ${stats.total_turns}`);
  console.log(`Speakers: ${stats.speakers.join(', ') || 'None identified'}`);
  
  console.log('\n🗣️  TRANSCRIPT');
  console.log('=====================================');
  
  transcript.forEach(turn => {
    const time = new Date(turn.timestamp).toLocaleTimeString();
    console.log(`\n[${time}] ${turn.speaker}:`);
    console.log(turn.content);
    if (turn.source_type && turn.source_type !== 'voice') {
      console.log(`  (${turn.source_type})`);
    }
  });
  
  if (transcript.length === 0) {
    console.log('\nNo transcript content found.');
  }
}

// If running directly from command line
if (require.main === module) {
  const meetingUrl = process.argv[2];
  
  if (!meetingUrl) {
    console.log('Usage: node get-meeting-transcript.cjs <meeting-url>');
    console.log('Example: node get-meeting-transcript.cjs "https://meet.google.com/abc-defg-hij"');
    process.exit(1);
  }
  
  getMeetingTranscript(meetingUrl)
    .then(data => {
      printTranscript(data);
      return pool.end();
    })
    .catch(err => {
      console.error('Error:', err);
      return pool.end();
    });
}

module.exports = { getMeetingTranscript, printTranscript };