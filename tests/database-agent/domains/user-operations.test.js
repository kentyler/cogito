#!/usr/bin/env node
/**
 * Test suite for UserOperations domain
 * Tests all user authentication and client management methods
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

async function runUserOperationsTests() {
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
    console.log('🧪 Running UserOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Test 1: Create User
    console.log('📝 Testing create()');
    try {
      const userData = {
        email: TestFixtures.generateTestEmail(),
        password: 'testpass123',
        metadata: { role: 'tester' }
      };
      
      const user = await dbAgent.users.create(userData);
      
      logTest('create() returns user object', !!user);
      logTest('create() sets correct email', user.email === userData.email);
      logTest('create() excludes password hash', !user.password_hash);
      logTest('create() includes metadata', user.metadata?.role === 'tester');
      
    } catch (error) {
      logTest('create()', false, error.message);
    }

    // Test 2: Find Users by Email
    console.log('\n🔍 Testing findUsersByEmail()');
    try {
      const testUser = await TestFixtures.createTestUser(dbAgent);
      const users = await dbAgent.users.findUsersByEmail(testUser.email);
      
      logTest('findUsersByEmail() finds existing user', users.length === 1);
      logTest('findUsersByEmail() includes password hash', !!users[0].password_hash);
      logTest('findUsersByEmail() case insensitive', 
        (await dbAgent.users.findUsersByEmail(testUser.email.toUpperCase())).length === 1
      );
      logTest('findUsersByEmail() returns empty for non-existent', 
        (await dbAgent.users.findUsersByEmail('nonexistent@test.com')).length === 0
      );
      
    } catch (error) {
      logTest('findUsersByEmail()', false, error.message);
    }

    // Test 3: Authenticate User
    console.log('\n🔐 Testing authenticate()');
    try {
      const email = TestFixtures.generateTestEmail();
      const password = 'testpass123';
      
      // Create user first
      await dbAgent.users.create({ email, password });
      
      // Test correct authentication
      const authUser = await dbAgent.users.authenticate(email, password);
      logTest('authenticate() with correct password', !!authUser);
      logTest('authenticate() excludes password hash', !authUser.password_hash);
      logTest('authenticate() returns correct email', authUser.email === email);
      
      // Test incorrect authentication
      const noAuthUser = await dbAgent.users.authenticate(email, 'wrongpassword');
      logTest('authenticate() with wrong password', noAuthUser === null);
      
      // Test non-existent user
      const noUser = await dbAgent.users.authenticate('fake@test.com', password);
      logTest('authenticate() non-existent user', noUser === null);
      
    } catch (error) {
      logTest('authenticate()', false, error.message);
    }

    // Test 4: Get User by ID
    console.log('\n👤 Testing getById()');
    try {
      const testUser = await TestFixtures.createTestUser(dbAgent);
      
      const user = await dbAgent.users.getById(testUser.id);
      logTest('getById() finds existing user', !!user);
      logTest('getById() excludes password hash', !user.password_hash);
      logTest('getById() returns null for non-existent', 
        (await dbAgent.users.getById(999999)) === null
      );
      
    } catch (error) {
      logTest('getById()', false, error.message);
    }

    // Test 5: Client Operations
    console.log('\n🏢 Testing client operations');
    try {
      // Create test user and client
      const testUser = await TestFixtures.createTestUser(dbAgent);
      const testClient = await TestFixtures.createTestClient(dbAgent);
      
      // Test getUserClients with no associations
      let clients = await dbAgent.users.getUserClients(testUser.id);
      logTest('getUserClients() with no clients', clients.length === 0);
      
      // Associate user with client
      await TestFixtures.associateUserWithClient(dbAgent, testUser.id, testClient.id, 'admin');
      
      // Test getUserClients with association
      clients = await dbAgent.users.getUserClients(testUser.id);
      logTest('getUserClients() with one client', clients.length === 1);
      logTest('getUserClients() includes role', clients[0].role === 'admin');
      logTest('getUserClients() includes client name', clients[0].client_name === testClient.name);
      
      // Test verifyClientAccess
      const access = await dbAgent.users.verifyClientAccess(testUser.id, testClient.id);
      logTest('verifyClientAccess() valid access', !!access);
      logTest('verifyClientAccess() includes role', access.role === 'admin');
      
      // Test verifyClientAccess with invalid client
      const noAccess = await dbAgent.users.verifyClientAccess(testUser.id, 999999);
      logTest('verifyClientAccess() invalid client', noAccess === null);
      
    } catch (error) {
      logTest('client operations', false, error.message);
    }

    // Test Summary
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! UserOperations is ready for use.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the errors above.');
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
      console.log('\n🧹 Test cleanup completed');
    }
  }

  return testResults;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUserOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runUserOperationsTests };