#!/usr/bin/env node
/**
 * Meetings API Routes Test Suite
 * Tests meeting operations via DatabaseAgent
 */

import { ApiTestSuite } from './api-test-framework.js';

const suite = new ApiTestSuite('Meetings API');

// Test: Create a new meeting via DatabaseAgent
suite.test('Should create a new meeting', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const meetingData = {
    name: 'Test Meeting via API',
    description: 'Created through meeting API test',
    meeting_type: 'manual',
    meeting_url: 'https://test.example.com/meeting',
    status: 'active',
    client_id: testClient.id,
    created_by_user_id: testUser.id,
    metadata: { test: true }
  };
  
  const meeting = await this.dbAgent.meetings.create(meetingData);
  
  if (!meeting || !meeting.id) {
    throw new Error('Failed to create meeting');
  }
  
  // Store for cleanup
  this.testMeetings.push(meeting);
  
  console.log('   📝 Meeting created with ID:', meeting.id);
  console.log('   📝 Meeting type:', meeting.meeting_type);
});

// Test: Update an existing meeting
suite.test('Should update an existing meeting', async function() {
  const testMeeting = await this.createTestMeeting();
  
  // Set a bot ID for the meeting so we can update its status
  const botId = `test-bot-${Date.now()}`;
  await this.dbAgent.query('UPDATE meetings.meetings SET recall_bot_id = $1 WHERE id = $2', [botId, testMeeting.id]);
  
  // Update the meeting status using bot ID
  const updated = await this.dbAgent.meetings.updateStatus(botId, 'completed');
  
  if (!updated || updated.status !== 'completed') {
    throw new Error('Failed to update meeting status');
  }
  
  // Verify ended_at is set for completed meetings
  if (updated.status === 'completed' && !updated.ended_at) {
    console.log('   ⚠️  Warning: ended_at not set for completed meeting');
  }
  
  console.log('   📝 Meeting status updated to:', updated.status);
  console.log('   📝 Meeting ended_at:', updated.ended_at ? 'set' : 'not set');
});

// Test: Delete a meeting
suite.test('Should delete a meeting', async function() {
  const testMeeting = await this.createTestMeeting();
  
  // Delete the meeting
  const result = await this.dbAgent.meetings.delete(testMeeting.id);
  
  if (!result || !result.meeting) {
    throw new Error('Failed to delete meeting');
  }
  
  if (result.turnsDeleted < 0) {
    throw new Error('Invalid turns deleted count');
  }
  
  // Remove from test meetings array since it's deleted
  this.testMeetings = this.testMeetings.filter(m => m.id !== testMeeting.id);
  
  console.log('   📝 Meeting deleted successfully');
  console.log('   📝 Turns deleted:', result.turnsDeleted);
});

// Test: Get meeting transcript
suite.test('Should retrieve meeting transcript', async function() {
  const testMeeting = await this.createTestMeeting();
  
  // Add a test transcript (as JSON)
  await this.dbAgent.query(
    'UPDATE meetings.meetings SET full_transcript = $1 WHERE id = $2',
    [JSON.stringify({ content: 'Test transcript content', type: 'text' }), testMeeting.id]
  );
  
  // Retrieve the transcript
  const transcript = await this.dbAgent.meetings.getTranscript(testMeeting.id);
  
  if (!transcript) {
    throw new Error('Failed to retrieve transcript');
  }
  
  if (!transcript.full_transcript) {
    throw new Error('No transcript content found');
  }
  
  // Parse JSON transcript
  const parsedTranscript = JSON.parse(transcript.full_transcript);
  if (!parsedTranscript.content || parsedTranscript.content !== 'Test transcript content') {
    throw new Error('Transcript content mismatch');
  }
  
  console.log('   📝 Transcript retrieved successfully');
  console.log('   📝 Transcript length:', transcript.full_transcript.length);
});

// Test: Add turn to meeting
suite.test('Should add turn to meeting', async function() {
  const testUser = await this.createTestUser();
  const testMeeting = await this.createTestMeeting();
  
  const turnData = {
    meeting_id: testMeeting.id,
    content: { role: 'user', content: 'Test turn content' },
    turn_index: 1,
    user_id: testUser.id,
    source_type: 'manual',
    metadata: { test: true }
  };
  
  const turn = await this.dbAgent.turns.createTurn(turnData);
  
  if (!turn || !turn.id) {
    throw new Error('Failed to create turn');
  }
  
  console.log('   📝 Turn added to meeting successfully:', turn.id);
  console.log('   📝 Turn content type:', typeof turn.content);
});

// Test: Update meeting status
suite.test('Should update meeting status', async function() {
  const testMeeting = await this.createTestMeeting();
  
  // Set a bot ID for the meeting
  const botId = `test-bot-status-${Date.now()}`;
  await this.dbAgent.query('UPDATE meetings.meetings SET recall_bot_id = $1 WHERE id = $2', [botId, testMeeting.id]);
  
  // Update status to 'joining'
  const joiningUpdate = await this.dbAgent.meetings.updateStatus(botId, 'joining');
  
  if (!joiningUpdate || joiningUpdate.status !== 'joining') {
    throw new Error('Failed to update meeting to joining status');
  }
  
  // Update status to 'completed'
  const completedUpdate = await this.dbAgent.meetings.updateStatus(botId, 'completed');
  
  if (!completedUpdate || completedUpdate.status !== 'completed') {
    throw new Error('Failed to update meeting to completed status');
  }
  
  console.log('   📝 Meeting status progression: active → joining → completed');
  console.log('   📝 Final status:', completedUpdate.status);
});

// Test: Handle invalid meeting ID
suite.test('Should handle invalid meeting ID gracefully', async function() {
  try {
    const result = await this.dbAgent.meetings.getById('invalid-meeting-id');
    
    if (result !== null) {
      throw new Error('Expected null for invalid meeting ID');
    }
    
    console.log('   📝 Invalid meeting ID properly returned null');
  } catch (error) {
    // Database errors for invalid UUIDs are expected
    if (error.message.includes('uuid') || error.message.includes('invalid input syntax')) {
      console.log('   📝 Invalid meeting ID handled with database error (expected)');
    } else {
      throw error;
    }
  }
});

// Test: Bulk meeting operations
suite.test('Should handle bulk meeting operations', async function() {
  const testClient = await this.createTestClient();
  const testUser = await this.createTestUser();
  
  // Create multiple meetings
  const meetings = [];
  for (let i = 0; i < 3; i++) {
    const meeting = await this.dbAgent.meetings.create({
      name: `Bulk Test Meeting ${i + 1}`,
      description: `Meeting ${i + 1} for bulk operations test`,
      meeting_type: 'manual',
      status: 'active',
      client_id: testClient.id,
      created_by_user_id: testUser.id,
      recall_bot_id: `test-bot-${i + 1}`,
      metadata: { bulk_test: true, index: i }
    });
    meetings.push(meeting);
    this.testMeetings.push(meeting);
  }
  
  // Test bulk operations
  const activeCount = await this.dbAgent.meetings.getActiveCount();
  if (activeCount < 3) {
    console.log('   ⚠️  Active count may include other meetings:', activeCount);
  }
  
  // Test bot ID lookup
  const botIds = meetings.map(m => m.recall_bot_id);
  const foundMeetings = await this.dbAgent.meetings.getByBotIds(botIds);
  
  if (foundMeetings.length !== 3) {
    throw new Error(`Expected 3 meetings by bot IDs, got ${foundMeetings.length}`);
  }
  
  console.log('   📝 Bulk operations successful: created', meetings.length, 'meetings');
  console.log('   📝 Bot ID lookup found:', foundMeetings.length, 'meetings');
});

// Run the test suite if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { suite as meetingsApiTestSuite };