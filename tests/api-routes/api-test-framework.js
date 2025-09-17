/**
 * API Route Testing Framework
 * Comprehensive testing utilities for Express.js API routes
 */

import { DatabaseAgent } from '../../database/database-agent.js';

export class ApiTestFramework {
  constructor() {
    this.dbAgent = null;
    this.testUsers = [];
    this.testClients = [];
    this.testMeetings = [];
  }

  // Initialize test environment 
  async setup() {
    console.log('🔧 Setting up API test framework...');
    
    // Initialize database connection
    this.dbAgent = new DatabaseAgent();
    await this.dbAgent.connect();
    
    console.log('✅ API test framework ready');
  }

  // Clean up test environment
  async teardown() {
    console.log('🧹 Cleaning up API test environment...');
    
    // Clean up test data
    if (this.dbAgent) {
      await this.cleanupTestData();
      await this.dbAgent.close();
    }
    
    console.log('✅ API test cleanup complete');
  }

  // Create test user with authentication
  async createTestUser(userData = {}) {
    const defaultUser = {
      email: `test-user-${Date.now()}@example.com`,
      password: 'test-password-123',
      active: true
    };
    
    const user = await this.dbAgent.users.create({ ...defaultUser, ...userData });
    this.testUsers.push(user);
    return user;
  }

  // Create test client
  async createTestClient(clientData = {}) {
    const defaultClient = {
      name: `Test Client ${Date.now()}`,
      email: `test-client-${Date.now()}@example.com`,
      story: 'Test client for API testing'
    };
    
    const client = await this.dbAgent.clients.createClient({ ...defaultClient, ...clientData });
    this.testClients.push(client);
    return client;
  }

  // Create test meeting
  async createTestMeeting(meetingData = {}) {
    // Ensure we have a test client and user
    if (this.testClients.length === 0) {
      await this.createTestClient();
    }
    if (this.testUsers.length === 0) {
      await this.createTestUser();
    }

    const defaultMeeting = {
      name: `Test Meeting ${Date.now()}`,
      description: 'Test meeting for API testing',
      meeting_type: 'manual',
      status: 'active',
      client_id: this.testClients[0].id,
      created_by_user_id: this.testUsers[0].id,
      metadata: { test: true }
    };
    
    const meeting = await this.dbAgent.meetings.create({ ...defaultMeeting, ...meetingData });
    this.testMeetings.push(meeting);
    return meeting;
  }

  // Create authenticated session for testing
  async createAuthenticatedSession(user = null) {
    if (!user && this.testUsers.length > 0) {
      user = this.testUsers[0];
    } else if (!user) {
      user = await this.createTestUser();
    }

    // Mock session data
    const sessionData = {
      user: {
        user_id: user.id,
        id: user.id,
        email: user.email,
        client_id: this.testClients.length > 0 ? this.testClients[0].id : null,
        client_name: this.testClients.length > 0 ? this.testClients[0].name : null
      }
    };

    return sessionData;
  }

  // Create mock turn processor  
  createMockTurnProcessor() {
    return {
      createTurn: async (turnData) => {
        // Use our dbAgent to create the turn (let it generate UUID)
        const turn = await this.dbAgent.turns.createTurn(turnData);
        return turn;
      },
      findSimilarTurns: async (turnId, limit, threshold, parentClientId = null) => {
        // Mock implementation - return empty array
        return [];
      }
    };
  }

  // Create mock Express request/response objects
  createMockRequest(data = {}, sessionData = null) {
    return {
      body: data,
      session: sessionData || {},
      sessionID: 'test-session-' + Date.now(),
      method: 'POST',
      path: '/test',
      ip: '127.0.0.1',
      get: (header) => header === 'User-Agent' ? 'Test Agent' : null,
      connection: { remoteAddress: '127.0.0.1' },
      turnProcessor: this.createMockTurnProcessor(),
      logger: { logEvent: async () => {}, logError: async () => {}, logAuthEvent: async () => {} },
      ...data.requestOverrides
    };
  }

  createMockResponse() {
    return {
      statusCode: 200,
      response: null,
      headers: {},
      cookies: new Map(),
      clearedCookies: [],
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.response = data; return this; },
      send: function(data) { this.response = data; return this; },
      set: function(key, value) { this.headers[key] = value; return this; },
      cookie: function(name, value, options) { this.cookies.set(name, { value, options }); return this; },
      clearCookie: function(name) { this.clearedCookies.push(name); return this; }
    };
  }

  // Clean up all test data
  async cleanupTestData() {
    console.log('🗑️ Cleaning up test data...');
    
    // Delete in reverse dependency order
    for (const meeting of this.testMeetings) {
      try {
        await this.dbAgent.meetings.delete(meeting.id);
      } catch (error) {
        console.warn(`Failed to delete test meeting ${meeting.id}:`, error.message);
      }
    }
    
    for (const client of this.testClients) {
      try {
        await this.dbAgent.clients.deleteClient(client.id);
      } catch (error) {
        console.warn(`Failed to delete test client ${client.id}:`, error.message);
      }
    }
    
    for (const user of this.testUsers) {
      try {
        // Delete user (this should cascade properly)
        await this.dbAgent.query('DELETE FROM client_mgmt.users WHERE id = $1', [user.id]);
      } catch (error) {
        console.warn(`Failed to delete test user ${user.id}:`, error.message);
      }
    }
    
    // Clear arrays
    this.testMeetings = [];
    this.testClients = [];
    this.testUsers = [];
    
    console.log('✅ Test data cleanup complete');
  }

  // Assert response helpers
  assertSuccess(response, expectedStatus = 200) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }
    return response.body;
  }

  assertError(response, expectedStatus = 400) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected error status ${expectedStatus}, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }
    return response.body;
  }

  // Test runner utility
  async runTest(testName, testFunction) {
    try {
      console.log(`🧪 Running: ${testName}`);
      await testFunction.call(this);
      console.log(`✅ ${testName}`);
      return { name: testName, passed: true };
    } catch (error) {
      console.log(`❌ ${testName}: ${error.message}`);
      return { name: testName, passed: false, error: error.message };
    }
  }
}

// Test suite runner
export class ApiTestSuite {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.framework = new ApiTestFramework();
    this.tests = [];
    this.results = { passed: 0, failed: 0, tests: [] };
  }

  // Add a test to the suite
  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  // Run all tests in the suite
  async run() {
    console.log(`\n🚀 Running API Test Suite: ${this.suiteName}`);
    console.log('='.repeat(60));
    
    try {
      await this.framework.setup();
      
      for (const test of this.tests) {
        const result = await this.framework.runTest(test.name, test.testFunction);
        this.results.tests.push(result);
        
        if (result.passed) {
          this.results.passed++;
        } else {
          this.results.failed++;
        }
      }
      
    } finally {
      await this.framework.teardown();
    }
    
    // Print summary
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   📈 Total: ${this.results.tests.length}`);
    
    if (this.results.failed === 0) {
      console.log(`🎉 All ${this.suiteName} tests passed!`);
    }
    
    return this.results;
  }
}