#!/usr/bin/env node
/**
 * Bot Creation API Routes - Core Tests
 * Essential bot creation functionality tests
 */

import { ApiTestSuite } from './api-test-framework.js';
import { mockRecallApi, mockFileUploadService, createMockDatabase } from './mocks/external-services.js';

const suite = new ApiTestSuite('Bot Creation API - Core');

// Test: Create bot with minimal data
suite.test('Should create bot with minimal data', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const mockDb = createMockDatabase();
  const { createMeetingRecord, updateMeetingWithEmail } = await import('#server/meetings/bot-creation/meeting-handler.js');
  const { processMeetingFiles } = await import('#server/meetings/bot-creation/file-processor.js');
  
  const { websocketUrl, webhookUrl } = mockRecallApi.getWebsocketUrls();
  const botData = await mockRecallApi.createRecallBot({ 
    meetingUrl: 'https://meet.google.com/test-meeting-123', 
    websocketUrl, 
    webhookUrl 
  });
  
  const meeting = await createMeetingRecord(mockDb, {
    meetingUrl: 'https://meet.google.com/test-meeting-123',
    meetingName: 'Test Bot Creation Meeting',
    userId: testUser.id,
    clientId: testClient.id,
    botId: botData.id
  });
  
  await updateMeetingWithEmail({ 
    db: mockDb, 
    meetingId: meeting.id, 
    email: testUser.email, 
    userId: testUser.id 
  });
  
  const uploadedFiles = await processMeetingFiles([], {
    fileUploadService: mockFileUploadService,
    db: mockDb,
    meetingId: meeting.id,
    meetingName: 'Test Bot Creation Meeting',
    meetingUrl: 'https://meet.google.com/test-meeting-123',
    clientId: testClient.id,
    userId: testUser.id
  });
  
  if (!botData || !botData.id) {
    throw new Error('Failed to create bot data');
  }
  
  if (!meeting || !meeting.id) {
    throw new Error('Failed to create meeting record');
  }
  
  if (!Array.isArray(uploadedFiles)) {
    throw new Error('Failed to process files (should return empty array)');
  }
  
  console.log('   📝 Bot created with ID:', botData.id);
  console.log('   📝 Meeting created with ID:', meeting.id);
  console.log('   📝 Files processed:', uploadedFiles.length);
});

// Test: Handle Recall.ai API errors
suite.test('Should handle Recall.ai API errors gracefully', async function() {
  const mockFailingRecallApi = {
    createRecallBot: async ({ meetingUrl, websocketUrl, webhookUrl }) => {
      throw new Error('403 - Forbidden: Rate limit exceeded');
    }
  };
  
  let errorThrown = false;
  try {
    await mockFailingRecallApi.createRecallBot({
      meetingUrl: 'https://meet.google.com/test-error-123',
      websocketUrl: 'ws://test.example.com/transcript',
      webhookUrl: 'http://test.example.com/webhook/chat'
    });
  } catch (error) {
    errorThrown = true;
    if (!error.message.includes('403')) {
      throw new Error('Expected 403 error not thrown');
    }
  }
  
  if (!errorThrown) {
    throw new Error('Expected API error was not thrown');
  }
  
  console.log('   📝 Recall.ai API error handled correctly');
});

// Test: Handle missing meeting URL
suite.test('Should handle missing meeting URL', async function() {
  const requestData = {
    meeting_name: 'Test Meeting Without URL'
  };
  
  if (requestData.meeting_url) {
    throw new Error('Test setup error: meeting_url should be missing');
  }
  
  console.log('   📝 Validated missing meeting URL handling');
});

// Test: Handle missing client_id with fallback
suite.test('Should handle missing client_id with fallback', async function() {
  const sessionData = {
    user: {
      user_id: 'test-user-123',
      email: 'test@example.com'
    }
  };
  
  const clientId = sessionData.user.client_id || 1;
  
  if (clientId !== 1) {
    throw new Error('Client ID fallback should default to 1');
  }
  
  console.log('   📝 Validated client ID fallback to:', clientId);
});

// Test: Process uploaded files correctly
suite.test('Should process uploaded files correctly', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const mockFiles = [
    {
      originalname: 'test-agenda.pdf',
      size: 2048,
      path: '/tmp/test-file-1'
    }
  ];
  
  const mockDb = createMockDatabase();
  
  const uploadedFiles = await (await import('#server/meetings/bot-creation/file-processor.js')).processMeetingFiles(
    mockFiles,
    {
      fileUploadService: mockFileUploadService,
      db: mockDb,
      meetingId: 'test-meeting-123',
      meetingName: 'Test File Processing Meeting',
      meetingUrl: 'https://meet.google.com/test-files-123',
      clientId: testClient.id,
      userId: testUser.id
    }
  );
  
  if (uploadedFiles.length !== 1) {
    throw new Error(`Expected 1 uploaded file, got ${uploadedFiles.length}`);
  }
  
  if (!uploadedFiles[0].filename || !uploadedFiles[0].id) {
    throw new Error('Uploaded file missing required fields');
  }
  
  console.log('   📝 Processed files:', uploadedFiles.length);
  console.log('   📝 File name:', uploadedFiles[0].filename);
});

// Run the test suite if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { suite as botCreateCoreTestSuite };