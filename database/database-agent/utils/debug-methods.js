/**
 * Debug and troubleshooting methods for DatabaseAgent
 */

/**
 * Debug meeting data by calling database function
 * @param {Object} dbAgent - DatabaseAgent instance
 * @param {string} meetingId - Meeting ID to debug
 * @returns {Promise<Array>} Debug information rows
 */
export async function debugMeeting(dbAgent, meetingId) {
  // Call the database function that returns a table
  const result = await dbAgent.query(
    'SELECT * FROM meetings.debug_meeting($1)',
    [meetingId]
  );
  
  // Format the results nicely
  console.log('\n========================================');
  console.log(`Debug info for meeting: ${meetingId}`);
  console.log('========================================');
  
  result.rows.forEach(row => {
    if (row.info_type === 'ERROR') {
      console.log(`❌ ${row.info_value}`);
    } else if (row.info_type.startsWith('TURN_')) {
      console.log(`  📝 ${row.info_type}: ${row.info_value}`);
    } else if (row.info_type.startsWith('TRANSCRIPT_')) {
      console.log(`  📄 ${row.info_type}: ${row.info_value}`);
    } else {
      console.log(`  ${row.info_type}: ${row.info_value}`);
    }
  });
  
  console.log('========================================\n');
  return result.rows;
}

/**
 * Inspect meeting using database RAISE NOTICE function
 * @param {Object} dbAgent - DatabaseAgent instance
 * @param {string} meetingId - Meeting ID to inspect
 */
export async function inspectMeeting(dbAgent, meetingId) {
  // Call the void function that prints with RAISE NOTICE
  // Note: This will print to console automatically if client supports it
  await dbAgent.query(
    'SELECT meetings.inspect_meeting($1)',
    [meetingId]
  );
}