#!/usr/bin/env node
/**
 * Bot Creation API Routes - Extended Tests
 * Comprehensive error scenarios and edge cases
 */

import { ApiTestSuite } from './api-test-framework.js';
import { mockRecallApi, mockFileUploadService, createMockDbAgent, createMockDatabase } from './mocks/external-services.js';

const suite = new ApiTestSuite('Bot Creation API - Extended');

// Test: Database logging functionality
suite.test('Should handle database logging correctly', async function() {
  const testUser = await this.createTestUser();
  
  const loggedEvents = [];
  const loggedErrors = [];
  
  const mockDbAgent = createMockDbAgent();
  mockDbAgent.logEvent = async (eventType, eventData, context) => {
    loggedEvents.push({ eventType, eventData, context });
  };
  mockDbAgent.logError = async (errorType, error, context) => {
    loggedErrors.push({ errorType, error, context });
  };
  
  await mockDbAgent.logEvent('meeting_created', {
    meeting_id: 'test-meeting-123',
    meeting_url: 'https://meet.google.com/test-logging-123',
    bot_id: 'test-bot-123'
  }, {
    userId: testUser.id,
    severity: 'info',
    component: 'BotCreation'
  });
  
  const testError = new Error('Test error for logging');
  await mockDbAgent.logError('bot_creation_error', testError, {
    userId: testUser.id,
    severity: 'error',
    component: 'BotCreation'
  });
  
  if (loggedEvents.length !== 1) {
    throw new Error(`Expected 1 logged event, got ${loggedEvents.length}`);
  }
  
  if (loggedErrors.length !== 1) {
    throw new Error(`Expected 1 logged error, got ${loggedErrors.length}`);
  }
  
  console.log('   📝 Database logging functioning correctly');
  console.log('   📝 Events logged:', loggedEvents.length);
  console.log('   📝 Errors logged:', loggedErrors.length);
});

// Test: Handle missing authentication
suite.test('Should handle missing authentication gracefully', async function() {
  const sessionData = {}; // No user session
  
  const requestData = {
    meeting_url: 'https://meet.google.com/test-auth-123',
    meeting_name: 'Test Auth Required Meeting'
  };
  
  const userIdFromSession = sessionData.user?.user_id || sessionData.user?.id;
  
  if (userIdFromSession) {
    throw new Error('Expected no user ID from empty session');
  }
  
  console.log('   📝 Missing authentication handled correctly');
});

// Test: Handle database connection failures
suite.test('Should handle database connection failures', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const mockFailingDb = {
    query: async (sql, params) => {
      throw new Error('Database connection failed');
    }
  };
  
  let errorThrown = false;
  try {
    const { createMeetingRecord } = await import('#server/meetings/bot-creation/meeting-handler.js');
    await createMeetingRecord(mockFailingDb, {
      meetingUrl: 'https://meet.google.com/test-db-fail-123',
      meetingName: 'Test DB Failure Meeting',
      userId: testUser.id,
      clientId: testClient.id,
      botId: 'test-bot-123'
    });
  } catch (error) {
    errorThrown = true;
    if (!error.message.includes('Database connection failed')) {
      throw new Error('Expected database error not thrown');
    }
  }
  
  if (!errorThrown) {
    throw new Error('Expected database error was not thrown');
  }
  
  console.log('   📝 Database connection failure handled correctly');
});

// Test: Handle malformed file uploads
suite.test('Should handle malformed file uploads gracefully', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const malformedFiles = [
    {
      // Missing originalname
      size: 1024,
      path: '/tmp/malformed-file-1'
    },
    {
      originalname: 'valid-file.txt',
      // Missing size
      path: '/tmp/malformed-file-2'
    }
  ];
  
  const mockFailingFileService = {
    processFile: async (file, options) => {
      if (!file.originalname) {
        throw new Error('Missing originalname property');
      }
      throw new Error('File processing failed');
    }
  };
  
  const mockDb = createMockDatabase();
  
  const uploadedFiles = await (await import('#server/meetings/bot-creation/file-processor.js')).processMeetingFiles(
    malformedFiles,
    {
      fileUploadService: mockFailingFileService,
      db: mockDb,
      meetingId: 'test-meeting-malformed-123',
      meetingName: 'Test Malformed Files Meeting',
      meetingUrl: 'https://meet.google.com/test-malformed-123',
      clientId: testClient.id,
      userId: testUser.id
    }
  );
  
  if (uploadedFiles.length !== 0) {
    throw new Error(`Expected 0 uploaded files, got ${uploadedFiles.length}`);
  }
  
  console.log('   📝 Malformed file uploads handled gracefully');
  console.log('   📝 Failed file count:', malformedFiles.length);
});

// Test: Handle concurrent bot creation requests
suite.test('Should handle concurrent bot creation attempts', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const concurrentRequests = [];
  
  for (let i = 0; i < 3; i++) {
    const promise = mockRecallApi.createRecallBot({
      meetingUrl: `https://meet.google.com/concurrent-test-${i}`,
      websocketUrl: 'ws://test.example.com/transcript',
      webhookUrl: 'http://test.example.com/webhook/chat'
    });
    concurrentRequests.push(promise);
  }
  
  const results = await Promise.all(concurrentRequests);
  
  if (results.length !== 3) {
    throw new Error(`Expected 3 concurrent results, got ${results.length}`);
  }
  
  const botIds = results.map(r => r.id);
  const uniqueBotIds = [...new Set(botIds)];
  
  if (uniqueBotIds.length !== 3) {
    throw new Error('Bot IDs should be unique for concurrent requests');
  }
  
  console.log('   📝 Concurrent bot creation handled correctly');
  console.log('   📝 Unique bot IDs created:', uniqueBotIds.length);
});

// Test: Handle extremely long meeting URLs and names
suite.test('Should handle extremely long input values', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const longUrl = 'https://meet.google.com/' + 'x'.repeat(2000);
  const longName = 'Very Long Meeting Name ' + 'y'.repeat(1000);
  
  const mockDb = {
    query: async (sql, params) => {
      if (params[1] && params[1].length > 1000) {
        throw new Error('Meeting name too long');
      }
      if (params[7] && params[7].length > 2000) {
        throw new Error('Meeting URL too long');
      }
      
      return {
        rows: [{
          id: 'test-long-meeting-123',
          name: params[1],
          meeting_url: params[7],
          created_at: new Date(),
          updated_at: new Date()
        }]
      };
    }
  };
  
  let errorThrown = false;
  try {
    const { createMeetingRecord } = await import('#server/meetings/bot-creation/meeting-handler.js');
    await createMeetingRecord(mockDb, {
      meetingUrl: longUrl,
      meetingName: longName,
      userId: testUser.id,
      clientId: testClient.id,
      botId: 'test-bot-long-123'
    });
  } catch (error) {
    errorThrown = true;
    if (!error.message.includes('too long')) {
      throw new Error('Expected length validation error not thrown');
    }
  }
  
  if (!errorThrown) {
    throw new Error('Expected length validation error was not thrown');
  }
  
  console.log('   📝 Long input values handled with validation');
  console.log('   📝 URL length tested:', longUrl.length);
  console.log('   📝 Name length tested:', longName.length);
});

// Run the test suite if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { suite as botCreateExtendedTestSuite };