#!/usr/bin/env node
/**
 * Basic MeetingOperations Tests - CRUD and Status Operations
 * Part 1 of MeetingOperations test suite (split for file size compliance)
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';
import { logTest, initializeTestResults } from './meeting-operations-test-helpers.js';

export async function runBasicMeetingOperationsTests() {
  let dbAgent;
  let testResults = initializeTestResults();

  try {
    console.log('🧪 Running Basic MeetingOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Test 1: Create Meeting
    console.log('📝 Testing create()');
    try {
      const testData = await TestFixtures.createTestMeeting(dbAgent);
      const meeting = testData.meeting;
      
      logTest(testResults, 'create() returns meeting object', !!meeting);
      logTest(testResults, 'create() includes id', !!meeting.id);
      logTest(testResults, 'create() sets correct name', meeting.name.includes('Test_Meeting_'));
      logTest(testResults, 'create() includes metadata', meeting.metadata?.test === true);
      logTest(testResults, 'create() has correct type', meeting.meeting_type === 'conversation');
      
    } catch (error) {
      logTest(testResults, 'create()', false, error.message);
    }

    // Test 2: Get Meeting by ID
    console.log('\n🔍 Testing getById()');
    try {
      const testData = await TestFixtures.createTestMeeting(dbAgent);
      const meetingId = testData.meeting.id;
      
      const meeting = await dbAgent.meetings.getById(meetingId);
      logTest(testResults, 'getById() finds existing meeting', !!meeting);
      logTest(testResults, 'getById() returns correct id', meeting.id === meetingId);
      
      const noMeeting = await dbAgent.meetings.getById('00000000-0000-0000-0000-000000000000');
      logTest(testResults, 'getById() returns null for non-existent', noMeeting === null);
      
    } catch (error) {
      logTest(testResults, 'getById()', false, error.message);
    }

    // Test 3: Bot ID Operations
    console.log('\n🤖 Testing bot ID operations');
    try {
      const testData = await TestFixtures.createTestMeetingWithBotId(dbAgent);
      const botId = testData.botId;
      const meetingId = testData.meeting.id;
      
      // Test getByBotId
      const meeting = await dbAgent.meetings.getByBotId(botId);
      logTest(testResults, 'getByBotId() finds meeting by bot ID', !!meeting);
      logTest(testResults, 'getByBotId() returns correct meeting', meeting.id === meetingId);
      
      // Test with excluded statuses
      await dbAgent.connector.query(
        "UPDATE meetings.meetings SET status = 'completed' WHERE id = $1",
        [meetingId]
      );
      const noMeeting = await dbAgent.meetings.getByBotId(botId); // completed is excluded by default
      logTest(testResults, 'getByBotId() respects excluded statuses', noMeeting === null);
      
      // Test with custom exclusions
      const meetingWithCustom = await dbAgent.meetings.getByBotId(botId, ['inactive']);
      logTest(testResults, 'getByBotId() allows custom exclusions', !!meetingWithCustom);
      
    } catch (error) {
      logTest(testResults, 'bot ID operations', false, error.message);
    }

    // Test 4: Status Updates
    console.log('\n📊 Testing updateStatus()');
    try {
      const testData = await TestFixtures.createTestMeetingWithBotId(dbAgent);
      const botId = testData.botId;
      
      // Update status
      const updatedMeeting = await dbAgent.meetings.updateStatus(botId, 'completed');
      logTest(testResults, 'updateStatus() returns updated meeting', !!updatedMeeting);
      logTest(testResults, 'updateStatus() changes status', updatedMeeting.status === 'completed');
      logTest(testResults, 'updateStatus() sets ended_at for completed', !!updatedMeeting.ended_at);
      
      // Test other status
      await dbAgent.meetings.updateStatus(botId, 'active');
      const activeMeeting = await dbAgent.meetings.getByBotId(botId, []); // no exclusions
      logTest(testResults, 'updateStatus() can change to active', activeMeeting.status === 'active');
      
    } catch (error) {
      logTest(testResults, 'updateStatus()', false, error.message);
    }

  } catch (error) {
    console.error('❌ Basic test suite error:', error);
  } finally {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
      console.log('\n🧹 Basic test cleanup completed');
    }
  }

  return testResults;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicMeetingOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}