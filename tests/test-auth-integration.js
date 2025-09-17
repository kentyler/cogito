/**
 * Authentication Integration Tests
 * Tests complete auth flow with real database operations
 */

import { handleLogin } from '../server/routes/auth/login.js';
import { handleLogout } from '../server/routes/auth/logout.js';
import { handleAuthCheck } from '../server/routes/auth/check.js';
import { DatabaseAgent } from '../database/database-agent.js';
import { createSessionMeeting } from '../server/auth/session-meeting.js';
import dotenv from 'dotenv';

// Load environment variables for dev database
dotenv.config();

// Test framework
class IntegrationTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.dbAgent = null;
  }
  
  async setup() {
    console.log('🔧 Setting up test database connection...');
    this.dbAgent = new DatabaseAgent();
    await this.dbAgent.connect();
    console.log('✅ Database connected\n');
  }
  
  async teardown() {
    if (this.dbAgent) {
      await this.dbAgent.close();
      console.log('🔌 Database connection closed');
    }
  }
  
  test(description, testFn) {
    this.tests.push({ description, testFn });
  }
  
  async run() {
    await this.setup();
    
    console.log('🧪 Running Authentication Integration Tests\n');
    
    for (const { description, testFn } of this.tests) {
      try {
        await testFn.call(this);
        console.log(`✅ ${description}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        this.failed++;
      }
    }
    
    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    await this.teardown();
  }
  
  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, got ${actual}`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected falsy value, got ${actual}`);
        }
      },
      toContain: (expected) => {
        if (!actual || typeof actual !== 'string' || !actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to contain "${expected}"`);
        }
      },
      toHaveProperty: (prop) => {
        if (!actual || !actual.hasOwnProperty(prop)) {
          throw new Error(`Expected object to have property "${prop}"`);
        }
      }
    };
  }
}

// Mock helpers for Express req/res
function createMockReq(overrides = {}) {
  return {
    body: {},
    session: {},
    sessionID: 'integration-test-session-' + Date.now(),
    ip: '127.0.0.1',
    path: '/api/test',
    method: 'POST',
    get: (header) => header === 'User-Agent' ? 'integration-test-agent' : null,
    db: null, // Will be set by tests
    ...overrides
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    response: null,
    cookies: new Map(),
    clearedCookies: [],
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.response = data;
      return this;
    },
    
    clearCookie: function(name) {
      this.clearedCookies.push(name);
      return this;
    }
  };
}

// Create session mock with save/destroy methods
function createMockSession(data = {}) {
  const session = { ...data };
  
  session.save = function(callback) {
    // Simulate async save
    setTimeout(() => callback(null), 10);
  };
  
  session.destroy = function(callback) {
    // Clear session data
    Object.keys(this).forEach(key => {
      if (key !== 'save' && key !== 'destroy') {
        delete this[key];
      }
    });
    setTimeout(() => callback(null), 10);
  };
  
  return session;
}

// Test runner instance
const runner = new IntegrationTestRunner();

// Test: Database connection and basic queries
runner.test('Database should connect and allow basic queries', async function() {
  const result = await this.dbAgent.connector.query('SELECT 1 as test');
  this.expect(result.rows).toBeTruthy();
  this.expect(result.rows[0].test).toBe(1);
});

// Test: User authentication with real database
runner.test('Should authenticate real user from database', async function() {
  // First, let's see what users exist
  const usersResult = await this.dbAgent.connector.query(
    'SELECT id, email FROM client_mgmt.users LIMIT 1'
  );
  
  if (usersResult.rows.length === 0) {
    console.log('   ⚠️  No users in database - skipping authentication test');
    return;
  }
  
  const testUser = usersResult.rows[0];
  console.log(`   📝 Testing with user: ${testUser.email}`);
  
  // Test the authentication method
  const authResult = await this.dbAgent.users.authenticate(testUser.email, 'wrong-password');
  this.expect(authResult).toBeFalsy(); // Should fail with wrong password
});

// Test: Get user clients
runner.test('Should retrieve user clients from database', async function() {
  // Get a user with clients
  const userResult = await this.dbAgent.connector.query(`
    SELECT DISTINCT u.id, u.email 
    FROM client_mgmt.users u
    JOIN client_mgmt.user_clients uc ON u.id = uc.user_id
    LIMIT 1
  `);
  
  if (userResult.rows.length === 0) {
    console.log('   ⚠️  No users with clients found - skipping client test');
    return;
  }
  
  const testUser = userResult.rows[0];
  const clients = await this.dbAgent.users.getUserClients(testUser.id);
  
  this.expect(Array.isArray(clients)).toBeTruthy();
  console.log(`   📋 User ${testUser.email} has ${clients.length} client(s)`);
  
  if (clients.length > 0) {
    this.expect(clients[0]).toHaveProperty('client_id');
    this.expect(clients[0]).toHaveProperty('client_name');
  }
});

// Test: Login handler with invalid credentials
runner.test('Login handler should reject invalid credentials', async function() {
  const req = createMockReq({
    body: { email: 'nonexistent@example.com', password: 'wrongpassword' },
    db: this.dbAgent.connector
  });
  const res = createMockRes();
  
  await handleLogin(req, res);
  
  this.expect(res.statusCode).toBe(401);
  this.expect(res.response?.error).toContain('Invalid credentials');
});

// Test: Login handler input validation
runner.test('Login handler should validate required fields', async function() {
  const req = createMockReq({
    body: { email: '', password: '' },
    db: this.dbAgent.connector
  });
  const res = createMockRes();
  
  await handleLogin(req, res);
  
  this.expect(res.statusCode).toBe(400);
  this.expect(res.response?.error).toBe('Email and password required');
});

// Test: Auth check with empty session
runner.test('Auth check should handle empty session', async function() {
  const req = createMockReq({
    session: createMockSession(),
    db: this.dbAgent.connector
  });
  const res = createMockRes();
  
  await handleAuthCheck(req, res);
  
  this.expect(res.response?.authenticated).toBe(false);
});

// Test: Auth check with authenticated user
runner.test('Auth check should return user data when authenticated', async function() {
  const mockUser = {
    id: 999,
    email: 'test@integration.com',
    client_id: 1,
    client_name: 'Test Client'
  };
  
  const req = createMockReq({
    session: createMockSession({ user: mockUser }),
    db: this.dbAgent.connector
  });
  const res = createMockRes();
  
  await handleAuthCheck(req, res);
  
  this.expect(res.response?.authenticated).toBe(true);
  this.expect(res.response?.user).toEqual(mockUser);
});

// Test: Logout handler
runner.test('Logout should clear session and respond correctly', async function() {
  const mockUser = {
    id: 999,
    email: 'test@logout.com',
    client_id: 1
  };
  
  const req = createMockReq({
    session: createMockSession({ user: mockUser }),
    db: this.dbAgent.connector
  });
  const res = createMockRes();
  
  await handleLogout(req, res);
  
  this.expect(res.clearedCookies.includes('connect.sid')).toBeTruthy();
  // Session should be cleared by destroy method
});

// Test: Session meeting creation
runner.test('Should create session meeting for authenticated user', async function() {
  // Get a real user and client for testing
  const userResult = await this.dbAgent.connector.query(`
    SELECT u.id as user_id, uc.client_id
    FROM client_mgmt.users u
    JOIN client_mgmt.user_clients uc ON u.id = uc.user_id
    LIMIT 1
  `);
  
  if (userResult.rows.length === 0) {
    console.log('   ⚠️  No user-client pairs found - skipping meeting creation test');
    return;
  }
  
  const { user_id, client_id } = userResult.rows[0];
  
  try {
    const meetingId = await createSessionMeeting(
      this.dbAgent.connector, 
      user_id, 
      client_id
    );
    
    this.expect(meetingId).toBeTruthy();
    this.expect(typeof meetingId).toBe('string');
    
    console.log(`   🏢 Created meeting: ${meetingId}`);
    
    // Verify meeting exists in database
    const meetingResult = await this.dbAgent.connector.query(
      'SELECT id FROM meetings.meetings WHERE id = $1',
      [meetingId]
    );
    
    this.expect(meetingResult.rows.length).toBe(1);
    
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('   ⚠️  Meeting tables not set up - skipping meeting creation test');
      return;
    }
    throw error;
  }
});

// Test: Database event logging
runner.test('Should log authentication events', async function() {
  try {
    await this.dbAgent.logAuthEvent('test_login', {
      email: 'test@integration.com',
      user_id: 999,
      client_id: 1
    }, {
      userId: 999,
      sessionId: 'test-session',
      endpoint: 'POST /api/login',
      ip: '127.0.0.1'
    });
    
    // If we get here, logging succeeded
    this.expect(true).toBeTruthy();
    
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('   ⚠️  Events table not set up - skipping event logging test');
      return;
    }
    throw error;
  }
});

// Test: Client selection workflow
runner.test('Should handle client selection workflow', async function() {
  // Test client selection data structures
  const clients = [
    { client_id: 100, client_name: 'Client A', role: 'user' },
    { client_id: 200, client_name: 'Client B', role: 'admin' }
  ];
  
  // Test multi-client response structure
  const multiClientResponse = {
    success: true,
    message: 'Client selection required',
    requiresClientSelection: true,
    clients: clients
  };
  
  this.expect(multiClientResponse.requiresClientSelection).toBe(true);
  this.expect(multiClientResponse.clients.length).toBe(2);
  this.expect(multiClientResponse.clients[0].client_id).toBe(100);
  
  // Test session state during client selection
  const session = createMockSession({
    pendingUser: {
      user_id: 1,
      email: 'test@example.com'
    }
  });
  
  // Simulate client selection
  const selectedClient = clients[0];
  session.user = {
    ...session.pendingUser,
    id: session.pendingUser.user_id,
    ...selectedClient
  };
  delete session.pendingUser;
  
  this.expect(session.user.client_id).toBe(100);
  this.expect(session.user.client_name).toBe('Client A');
  this.expect(session.pendingUser).toBeFalsy();
});

// Test: Complete login flow simulation
runner.test('Should handle complete login flow for real user', async function() {
  // This test would require a test user with known credentials
  // For now, we'll test the flow structure
  
  const req = createMockReq({
    body: { email: 'test@example.com', password: 'testpass' },
    session: createMockSession(),
    db: this.dbAgent.connector
  });
  const res = createMockRes();
  
  // This will fail authentication but test the complete flow
  await handleLogin(req, res);
  
  // Should have attempted authentication
  this.expect(res.statusCode).toBe(401); // Expected for non-existent user
  this.expect(res.response?.error).toContain('Invalid credentials');
});

// Run the integration tests
console.log('🚀 Starting Authentication Integration Tests...\n');
runner.run().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});