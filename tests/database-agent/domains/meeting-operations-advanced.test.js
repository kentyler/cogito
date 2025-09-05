#!/usr/bin/env node
/**
 * Advanced MeetingOperations Tests - Complex Operations and Bulk
 * Part 2 of MeetingOperations test suite (split for file size compliance)
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';
import { logTest, initializeTestResults } from './meeting-operations-test-helpers.js';

export async function runAdvancedMeetingOperationsTests() {
  let dbAgent;
  let testResults = initializeTestResults();

  try {
    console.log('🧪 Running Advanced MeetingOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Test 1: List with Statistics
    console.log('📋 Testing listWithStats()');
    try {
      // Create test meeting with turns
      const testData = await TestFixtures.createTestMeeting(dbAgent);
      const meeting = testData.meeting;
      const clientId = meeting.client_id;
      
      // Add some test turns
      await TestFixtures.createTestTurns(dbAgent, meeting.id, 3);
      
      const meetings = await dbAgent.meetings.listWithStats(clientId);
      logTest(testResults, 'listWithStats() returns array', Array.isArray(meetings));
      
      const ourMeeting = meetings.find(m => m.block_id === meeting.id);
      logTest(testResults, 'listWithStats() includes created meeting', !!ourMeeting);
      logTest(testResults, 'listWithStats() includes turn count', ourMeeting?.turn_count === 3);
      logTest(testResults, 'listWithStats() includes first_turn_time', !!ourMeeting?.first_turn_time);
      
      // Check for new fields added in refactoring
      logTest(testResults, 'listWithStats() includes block_id (legacy compatibility)', !!ourMeeting?.block_id);
      logTest(testResults, 'listWithStats() includes block_name (legacy compatibility)', !!ourMeeting?.block_name);
      logTest(testResults, 'listWithStats() includes embedded_count', typeof ourMeeting?.embedded_count === 'number');
      logTest(testResults, 'listWithStats() includes participant_count', typeof ourMeeting?.participant_count === 'number');
      logTest(testResults, 'listWithStats() includes participant_names', Array.isArray(ourMeeting?.participant_names));
      logTest(testResults, 'listWithStats() includes meeting_start_time', Object.prototype.hasOwnProperty.call(ourMeeting || {}, 'meeting_start_time'));
      logTest(testResults, 'listWithStats() includes meeting_end_time', Object.prototype.hasOwnProperty.call(ourMeeting || {}, 'meeting_end_time'));
      
      // Test with pagination
      const limitedMeetings = await dbAgent.meetings.listWithStats(clientId, { limit: 1, offset: 0 });
      logTest(testResults, 'listWithStats() respects limit', limitedMeetings.length <= 1);
      
      // Test excludeSystemMeetings option
      const allMeetings = await dbAgent.meetings.listWithStats(clientId, { excludeSystemMeetings: false });
      const nonSystemMeetings = await dbAgent.meetings.listWithStats(clientId, { excludeSystemMeetings: true });
      logTest(testResults, 'listWithStats() excludeSystemMeetings option works', 
        allMeetings.length >= nonSystemMeetings.length);
      
    } catch (error) {
      logTest(testResults, 'listWithStats()', false, error.message);
    }

    // Test 2: Delete Meeting with Cascading
    console.log('\n🗑️ Testing delete()');
    try {
      // Create meeting with turns
      const testData = await TestFixtures.createTestMeeting(dbAgent);
      const meetingId = testData.meeting.id;
      
      // Add turns to test cascading delete
      const turns = await TestFixtures.createTestTurns(dbAgent, meetingId, 2);
      logTest(testResults, 'delete() setup - turns created', turns.length === 2);
      
      // Delete the meeting
      const deleteResult = await dbAgent.meetings.delete(meetingId);
      logTest(testResults, 'delete() returns result object', !!deleteResult);
      logTest(testResults, 'delete() returns deleted meeting', !!deleteResult.meeting);
      logTest(testResults, 'delete() reports turns deleted', deleteResult.deletedTurns === 2);
      
      // Verify meeting is gone
      const deletedMeeting = await dbAgent.meetings.getById(meetingId);
      logTest(testResults, 'delete() removes meeting from database', deletedMeeting === null);
      
      // Verify turns are gone
      const remainingTurns = await dbAgent.connector.query(
        'SELECT COUNT(*) as count FROM meetings.turns WHERE meeting_id = $1',
        [meetingId]
      );
      logTest(testResults, 'delete() cascades to remove turns', remainingTurns.rows[0].count === '0');
      
    } catch (error) {
      logTest(testResults, 'delete()', false, error.message);
    }

    // Test 3: Active Count and Bulk Operations
    console.log('\n🔢 Testing bulk operations');
    try {
      // Create multiple active meetings
      const testData1 = await TestFixtures.createTestMeetingWithBotId(dbAgent, { status: 'active' });
      const testData2 = await TestFixtures.createTestMeetingWithBotId(dbAgent, { status: 'active' });
      const testData3 = await TestFixtures.createTestMeetingWithBotId(dbAgent, { status: 'completed' });
      
      // Test active count
      const activeCount = await dbAgent.meetings.getActiveCount();
      logTest(testResults, 'getActiveCount() returns number', typeof activeCount === 'number');
      logTest(testResults, 'getActiveCount() includes test meetings', activeCount >= 2);
      
      // Test bulk bot ID lookup
      const botIds = [testData1.botId, testData2.botId, testData3.botId];
      const meetings = await dbAgent.meetings.getByBotIds(botIds);
      logTest(testResults, 'getByBotIds() returns array', Array.isArray(meetings));
      logTest(testResults, 'getByBotIds() finds all meetings', meetings.length === 3);
      
      // Test empty array
      const emptyResult = await dbAgent.meetings.getByBotIds([]);
      logTest(testResults, 'getByBotIds() handles empty array', emptyResult.length === 0);
      
    } catch (error) {
      logTest(testResults, 'bulk operations', false, error.message);
    }

    // Test 4: Transcript and Email Operations
    console.log('\n📄 Testing transcript operations');
    try {
      const testData = await TestFixtures.createTestMeeting(dbAgent);
      const meetingId = testData.meeting.id;
      
      // Test getting transcript (should have null full_transcript initially)
      const transcript = await dbAgent.meetings.getTranscript(meetingId);
      logTest(testResults, 'getTranscript() returns meeting with null transcript', 
        transcript && transcript.full_transcript === null);
      
      // Add a transcript (JSONB format)
      const transcriptData = { content: 'This is a test transcript content', turns: [] };
      await dbAgent.connector.query(
        'UPDATE meetings.meetings SET full_transcript = $1 WHERE id = $2',
        [JSON.stringify(transcriptData), meetingId]
      );
      
      const updatedTranscript = await dbAgent.meetings.getTranscript(meetingId);
      logTest(testResults, 'getTranscript() returns transcript content', 
        updatedTranscript && updatedTranscript.full_transcript && 
        JSON.parse(updatedTranscript.full_transcript).content === 'This is a test transcript content');
      
      // Test mark email sent
      const emailResult = await dbAgent.meetings.markEmailSent(meetingId);
      logTest(testResults, 'markEmailSent() returns updated meeting', !!emailResult);
      logTest(testResults, 'markEmailSent() sets email_sent flag', emailResult.email_sent === true);
      
    } catch (error) {
      logTest(testResults, 'transcript operations', false, error.message);
    }

  } catch (error) {
    console.error('❌ Advanced test suite error:', error);
  } finally {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
      console.log('\n🧹 Advanced test cleanup completed');
    }
  }

  return testResults;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdvancedMeetingOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}