#!/usr/bin/env node
/**
 * Test suite for ClientOperations domain - Basic CRUD operations
 * Tests client creation, retrieval, update, and deletion
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

export async function runClientOperationsTests() {
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
    console.log('🧪 Running ClientOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    let testClientId;

    // Test 1: Create Client
    console.log('📝 Testing createClient()');
    try {
      const clientData = {
        name: 'Test Client ' + Date.now(),
        story: 'A test client created by automated tests',
        metadata: { test: true, source: 'automated-test' }
      };
      
      const client = await dbAgent.clients.createClient(clientData);
      testClientId = client.id;
      
      logTest('createClient() returns client object', !!client);
      logTest('createClient() sets correct name', client.name === clientData.name);
      logTest('createClient() sets story', client.story === clientData.story);
      logTest('createClient() includes metadata', !!client.metadata);
      logTest('createClient() generates ID', !!client.id);
      
    } catch (error) {
      logTest('createClient()', false, error.message);
    }

    // Test 2: Get Client by ID
    console.log('\n📝 Testing getClientById()');
    try {
      const client = await dbAgent.clients.getClientById(testClientId);
      
      logTest('getClientById() returns client', !!client);
      logTest('getClientById() returns correct ID', client.id === testClientId);
      logTest('getClientById() includes all fields', 
        client.name && client.hasOwnProperty('story') && client.metadata);
      
    } catch (error) {
      logTest('getClientById()', false, error.message);
    }

    // Test 3: Update Client
    console.log('\n📝 Testing updateClient()');
    try {
      const updates = {
        name: 'Updated Test Client',
        story: 'Updated story for test client'
      };
      
      const updatedClient = await dbAgent.clients.updateClient(testClientId, updates);
      
      logTest('updateClient() returns updated client', !!updatedClient);
      logTest('updateClient() updates name', updatedClient.name === updates.name);
      logTest('updateClient() updates story', updatedClient.story === updates.story);
      logTest('updateClient() preserves ID', updatedClient.id === testClientId);
      
    } catch (error) {
      logTest('updateClient()', false, error.message);
    }

    // Test 4: Get Client Stats
    console.log('\n📝 Testing getClientStats()');
    try {
      const stats = await dbAgent.clients.getClientStats(testClientId);
      
      logTest('getClientStats() returns stats object', !!stats);
      logTest('getClientStats() includes user_count', typeof stats.user_count === 'number');
      logTest('getClientStats() includes meeting_count', typeof stats.meeting_count === 'number');
      logTest('getClientStats() includes file_count', typeof stats.file_count === 'number');
      
    } catch (error) {
      logTest('getClientStats()', false, error.message);
    }

    // Test 5: Get All Clients with Stats
    console.log('\n📝 Testing getAllClientsWithStats()');
    try {
      const clientsWithStats = await dbAgent.clients.getAllClientsWithStats();
      
      logTest('getAllClientsWithStats() returns array', Array.isArray(clientsWithStats));
      logTest('getAllClientsWithStats() includes test client', 
        clientsWithStats.some(c => c.id === testClientId));
      logTest('getAllClientsWithStats() includes stats for each client',
        clientsWithStats.every(c => typeof c.user_count === 'number'));
      
    } catch (error) {
      logTest('getAllClientsWithStats()', false, error.message);
    }

    // Test 6: Error Handling
    console.log('\n📝 Testing error handling');
    try {
      const nonExistent = await dbAgent.clients.getClientById(999999);
      logTest('getClientById() returns null for non-existent ID', nonExistent === null);
      
    } catch (error) {
      logTest('Error handling', false, error.message);
    }

    // Test 7: Delete Client
    console.log('\n📝 Testing deleteClient()');
    try {
      const deletedClient = await dbAgent.clients.deleteClient(testClientId);
      
      logTest('deleteClient() returns deleted client', !!deletedClient);
      logTest('deleteClient() returns correct ID', deletedClient.id === testClientId);
      
      // Verify deletion
      const shouldBeNull = await dbAgent.clients.getClientById(testClientId);
      logTest('deleteClient() actually removes client', shouldBeNull === null);
      
    } catch (error) {
      logTest('deleteClient()', false, error.message);
    }

    // Test 8: User Client Access Check
    console.log('\n📝 Testing checkUserClientAccess()');
    try {
      // First create a test user and client association
      const testUser = await dbAgent.users.create({
        email: 'test-access-' + Date.now() + '@example.com',
        password: 'TestPass123!',
        metadata: { display_name: 'Test Access User' }
      });
      
      const testClient2 = await dbAgent.clients.createClient({
        name: 'Test Client for Access ' + Date.now(),
        story: 'Testing user access checks'
      });
      
      // Add user to client
      await dbAgent.clients.addUserToClient(testUser.id, testClient2.id, 'member');
      
      // Test positive access check
      const hasAccess = await dbAgent.clients.checkUserClientAccess(testUser.id, testClient2.id);
      logTest('checkUserClientAccess() returns true for valid access', hasAccess === true);
      
      // Test negative access check (user not associated with different client)
      const testClient3 = await dbAgent.clients.createClient({
        name: 'Another Test Client ' + Date.now(),
        story: 'Testing no access'
      });
      
      const noAccess = await dbAgent.clients.checkUserClientAccess(testUser.id, testClient3.id);
      logTest('checkUserClientAccess() returns false for no access', noAccess === false);
      
      // Clean up
      await dbAgent.clients.deleteClient(testClient2.id);
      await dbAgent.clients.deleteClient(testClient3.id);
      // User cleanup will be handled by the test cleanup
      
    } catch (error) {
      logTest('checkUserClientAccess()', false, error.message);
    }

    // Test 9: User Management (moved to separate test file)
    // See client-operations-user-mgmt.test.js for user management tests

    // Test 10: Validation
    console.log('\n📝 Testing validation');
    try {
      await dbAgent.clients.createClient({ name: '' });
      logTest('createClient() validates empty name', false);
    } catch (error) {
      logTest('createClient() validates empty name', error.message.includes('required'));
    }

    try {
      await dbAgent.clients.createClient({});
      logTest('createClient() validates missing name', false);
    } catch (error) {
      logTest('createClient() validates missing name', error.message.includes('required'));
    }

    // DatabaseAgent Method Signature Smoke Tests
    console.log('\n🔧 Testing DatabaseAgent method signatures');
    try {
      // Test createClient signature
      const testClient = await dbAgent.clients.createClient({
        name: 'Smoke Test Client',
        story: 'Test client for signature validation'
      });
      logTest('createClient() signature valid', true);
      
      // Test getClientById signature
      await dbAgent.clients.getClientById(testClient.id);
      logTest('getClientById() signature valid', true);
      
      // Test getAllClients signature
      await dbAgent.clients.getAllClients();
      logTest('getAllClients() signature valid', true);
      
      // Test updateClient signature
      try {
        await dbAgent.clients.updateClient(testClient.id, { story: 'Updated story' });
        logTest('updateClient() signature valid', true);
      } catch (error) {
        if (error.message.includes('does not exist') || error.message.includes('function')) {
          logTest('updateClient() signature valid', false, 'Method not implemented');
        } else {
          logTest('updateClient() signature valid', true);
        }
      }
      
      // Test deleteClient signature  
      try {
        await dbAgent.clients.deleteClient(999999);
        logTest('deleteClient() signature valid', true);
      } catch (error) {
        if (error.message.includes('does not exist') || error.message.includes('function')) {
          logTest('deleteClient() signature valid', false, 'Method not implemented');
        } else {
          logTest('deleteClient() signature valid', true);
        }
      }
      
    } catch (error) {
      logTest('DatabaseAgent client method signatures', false, error.message);
    }

    return testResults;

  } catch (error) {
    console.error('❌ Test suite error:', error);
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
  runClientOperationsTests().then(results => {
    console.log(`\n📊 Test Summary:`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Total:  ${results.passed + results.failed}`);
    process.exit(results.failed > 0 ? 1 : 0);
  });
}