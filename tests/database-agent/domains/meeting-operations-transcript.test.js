#!/usr/bin/env node
/**
 * Test suite for Meeting Operations - Transcript and Creator functionality
 * Tests enhanced transcript retrieval and creator information queries
 */

import { getTestDbAgent, cleanupTestData } from '../test-helpers/db-setup.js';

export async function runMeetingTranscriptTests() {
  let dbAgent;
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}${message ? ' - ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }

  try {
    console.log('📋 Running Meeting Transcript Tests\n');
    
    dbAgent = await getTestDbAgent();
    let testMeetingId, testUserId, testClientId;

    // Create test client
    const testClient = await dbAgent.clients.createClient({
      name: 'Meeting Test Client',
      story: 'A client for testing meeting functionality'
    });
    testClientId = testClient.id;

    // Create test user
    const testUser = await dbAgent.users.create({
      email: 'meetingcreator@example.com',
      password: 'testpass123'
    });
    testUserId = testUser.id;

    // Test 1: Create meeting with creator
    console.log('📝 Testing meeting creation with creator');
    try {
      const meetingData = {
        name: 'Test Meeting for Transcript',
        description: 'A test meeting for transcript functionality',
        client_id: testClientId,
        created_by_user_id: testUserId,
        meeting_type: 'cogito_web',
        status: 'completed',
        metadata: {},
        full_transcript: 'This is a test transcript.\n\nSpeaker 1: Hello everyone.\nSpeaker 2: How is everyone doing today?\nSpeaker 1: Great, thanks for asking!'
      };

      const meeting = await dbAgent.meetings.createMeeting(meetingData);
      testMeetingId = meeting.id;
      
      logTest('createMeeting() with creator and transcript', !!meeting);
      logTest('createMeeting() sets correct creator', meeting.created_by_user_id === testUserId);
      logTest('createMeeting() includes transcript', !!meeting.full_transcript);
      
    } catch (error) {
      logTest('Meeting creation with creator', false, error.message);
    }

    // Test 2: Get meeting with creator information
    console.log('\n📝 Testing getMeetingWithCreator()');
    try {
      const meetingWithCreator = await dbAgent.meetings.getMeetingWithCreator(testMeetingId);
      
      logTest('getMeetingWithCreator() returns meeting', !!meetingWithCreator);
      logTest('getMeetingWithCreator() includes creator email', meetingWithCreator.created_by_email === 'meetingcreator@example.com');
      logTest('getMeetingWithCreator() includes creator user ID', meetingWithCreator.created_by_user_id === testUserId);
      logTest('getMeetingWithCreator() includes turn count', typeof meetingWithCreator.turn_count === 'number');
      logTest('getMeetingWithCreator() includes participant count', typeof meetingWithCreator.participant_count === 'number');
      
    } catch (error) {
      logTest('getMeetingWithCreator()', false, error.message);
    }

    // Test 3: Get meeting transcript with details
    console.log('\n📝 Testing getTranscript()');
    try {
      const transcriptData = await dbAgent.meetings.getTranscript(testMeetingId);
      
      logTest('getTranscript() returns transcript data', !!transcriptData);
      logTest('getTranscript() includes full transcript', !!transcriptData.full_transcript);
      logTest('getTranscript() includes meeting name', transcriptData.name === 'Test Meeting for Transcript');
      logTest('getTranscript() includes creator email', transcriptData.created_by_email === 'meetingcreator@example.com');
      logTest('getTranscript() includes meeting status', transcriptData.status === 'completed');
      
    } catch (error) {
      logTest('getTranscript()', false, error.message);
    }

    // Test 4: Test with non-existent meeting (use proper UUID format)
    console.log('\n📝 Testing error handling');
    try {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const nonExistent = await dbAgent.meetings.getMeetingWithCreator(fakeUuid);
      logTest('getMeetingWithCreator() returns null for non-existent meeting', nonExistent === null);
      
      const noTranscript = await dbAgent.meetings.getTranscript(fakeUuid);
      logTest('getTranscript() returns null for non-existent meeting', noTranscript === null);
      
    } catch (error) {
      logTest('Error handling', false, error.message);
    }

    return testResults;

  } catch (error) {
    console.error('❌ Meeting transcript test error:', error);
    logTest('Meeting transcript tests', false, error.message);
    return testResults;
  } finally {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMeetingTranscriptTests().then(results => {
    console.log(`\n📊 Meeting Transcript Test Summary:`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Total:  ${results.passed + results.failed}`);
    process.exit(results.failed > 0 ? 1 : 0);
  });
}