/**
 * Jest test suite for Meeting Operations - Transcript and Creator functionality
 * Tests enhanced transcript retrieval and creator information queries
 */

import { getTestDbAgent, cleanupTestData } from '../test-helpers/db-setup.js';

describe('Meeting Operations - Transcript Tests', () => {
  let dbAgent;
  let testClientId, testUserId, testMeetingId;

  beforeEach(async () => {
    dbAgent = await getTestDbAgent();
    
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
  });

  afterEach(async () => {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
    }
  });

  test('createMeeting() with creator and transcript', async () => {
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
    
    expect(meeting).toBeTruthy();
    expect(meeting.created_by_user_id).toBe(testUserId);
    expect(meeting.full_transcript).toBeTruthy();
  });

  test('getMeetingWithCreator() returns meeting with creator info', async () => {
    // Create meeting first
    const meetingData = {
      name: 'Test Meeting for Creator',
      client_id: testClientId,
      created_by_user_id: testUserId,
      meeting_type: 'cogito_web'
    };
    
    const meeting = await dbAgent.meetings.createMeeting(meetingData);
    testMeetingId = meeting.id;

    const meetingWithCreator = await dbAgent.meetings.getMeetingWithCreator(testMeetingId);
    
    expect(meetingWithCreator).toBeTruthy();
    expect(meetingWithCreator.created_by_email).toBe('meetingcreator@example.com');
    expect(meetingWithCreator.created_by_user_id).toBe(testUserId);
    expect(typeof meetingWithCreator.turn_count).toBe('number');
    expect(typeof meetingWithCreator.participant_count).toBe('number');
  });

  test('getTranscript() returns transcript with meeting details', async () => {
    const meetingData = {
      name: 'Test Meeting for Transcript Retrieval',
      client_id: testClientId,
      created_by_user_id: testUserId,
      meeting_type: 'cogito_web',
      status: 'completed',
      full_transcript: 'Test transcript content'
    };
    
    const meeting = await dbAgent.meetings.createMeeting(meetingData);
    testMeetingId = meeting.id;

    const transcriptData = await dbAgent.meetings.getTranscript(testMeetingId);
    
    expect(transcriptData).toBeTruthy();
    expect(transcriptData.full_transcript).toBe('Test transcript content');
    expect(transcriptData.name).toBe('Test Meeting for Transcript Retrieval');
    expect(transcriptData.created_by_email).toBe('meetingcreator@example.com');
    expect(transcriptData.status).toBe('completed');
  });

  test('error handling for non-existent meetings', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    
    const nonExistent = await dbAgent.meetings.getMeetingWithCreator(fakeUuid);
    expect(nonExistent).toBeNull();
    
    const noTranscript = await dbAgent.meetings.getTranscript(fakeUuid);
    expect(noTranscript).toBeNull();
  });
});