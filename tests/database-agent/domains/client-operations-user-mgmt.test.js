#!/usr/bin/env node
/**
 * Test suite for ClientOperations User Management
 * Tests user-client associations and user management functionality
 */

import { getTestDbAgent, cleanupTestData } from '../test-helpers/db-setup.js';

export async function runUserManagementTests() {
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
    console.log('👥 Running User Management Tests\n');
    
    dbAgent = await getTestDbAgent();

    // Create a test client for user management tests
    const userTestClient = await dbAgent.clients.createClient({
      name: 'User Management Test Client',
      story: 'A client for testing user management functionality'
    });
    
    // First create a test user
    const testUser = await dbAgent.users.create({
      email: 'testuser@example.com', 
      password: 'testpass123'
    });
    
    // Test adding user to client
    const userClientAssoc = await dbAgent.clients.addUserToClient(testUser.id, userTestClient.id, 'user');
    logTest('addUserToClient() creates association', !!userClientAssoc);
    logTest('addUserToClient() sets correct role', userClientAssoc.role === 'user');
    
    // Test getting client users
    const clientUsers = await dbAgent.clients.getClientUsers(userTestClient.id);
    logTest('getClientUsers() returns array', Array.isArray(clientUsers));
    logTest('getClientUsers() finds added user', clientUsers.some(u => u.id === testUser.id));
    
    // Test removing user from client
    const removed = await dbAgent.clients.removeUserFromClient(testUser.id, userTestClient.id);
    logTest('removeUserFromClient() returns true', removed === true);
    
    // Verify user is no longer active for client
    const clientUsersAfterRemoval = await dbAgent.clients.getClientUsers(userTestClient.id);
    logTest('removeUserFromClient() removes user from active list', 
      !clientUsersAfterRemoval.some(u => u.id === testUser.id));

    return testResults;

  } catch (error) {
    console.error('❌ User management test error:', error);
    logTest('User management tests', false, error.message);
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
  runUserManagementTests().then(results => {
    console.log(`\n📊 User Management Test Summary:`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Total:  ${results.passed + results.failed}`);
    process.exit(results.failed > 0 ? 1 : 0);
  });
}