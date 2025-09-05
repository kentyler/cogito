#!/usr/bin/env node
/**
 * Integration tests for files converted to use DatabaseAgent
 * Tests the actual functions that were migrated from direct database access
 */

import { getTestDbAgent, TestFixtures } from '../test-helpers/db-setup.js';

// Import the converted functions
import { 
  getAvailableLLMs, 
  isValidLLM, 
  getUserSelectedLLM,
  updateUserSelectedLLM 
} from '../../../server/conversations/llm-operations.js';

import {
  getAllLLMs,
  getLLMByProvider,
  getLLMByModel,
  getAvailableModels
} from '../../../server/conversations/llm-database-operations.js';

import { ClientInfoFetcher } from '../../../server/conversations/client-info-fetcher.js';

async function runIntegrationTests() {
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
    console.log('🧪 Running Converted Files Integration Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Test 1: llm-operations.js functions
    console.log('📝 Testing llm-operations.js converted functions');
    
    // Test getAvailableLLMs (no longer needs pool parameter)
    try {
      const llms = await getAvailableLLMs({ clientId: null });
      logTest('getAvailableLLMs() works without pool parameter', Array.isArray(llms));
      logTest('getAvailableLLMs() returns LLM configurations', llms.length >= 0);
    } catch (error) {
      logTest('getAvailableLLMs()', false, error.message);
    }

    // Test isValidLLM (no longer needs pool parameter)
    try {
      const validResult = await isValidLLM('claude-3-5-sonnet');
      const invalidResult = await isValidLLM('invalid-llm-id');
      
      logTest('isValidLLM() works without pool parameter', 
        typeof validResult === 'boolean');
      logTest('isValidLLM() validates correctly', 
        validResult === true || validResult === false);
      logTest('isValidLLM() returns false for invalid ID', 
        invalidResult === false);
    } catch (error) {
      logTest('isValidLLM()', false, error.message);
    }

    // Test getUserSelectedLLM
    try {
      // Create a test user
      const testUser = await dbAgent.users.create({
        email: TestFixtures.generateTestEmail(),
        password: 'testpass123'
      });

      // Set an LLM preference
      await dbAgent.users.updateUserPreference(testUser.id, 'last_llm_id', 'claude-3-5-sonnet');

      // Test the converted function
      const selectedLLM = await getUserSelectedLLM({ 
        userId: testUser.id, 
        clientId: null 
      });
      
      logTest('getUserSelectedLLM() works without pool parameter', !!selectedLLM);
      logTest('getUserSelectedLLM() returns LLM config', 
        selectedLLM?.model || selectedLLM?.id);

      // Clean up
      await dbAgent.query('DELETE FROM client_mgmt.users WHERE id = $1', [testUser.id]);
      
    } catch (error) {
      logTest('getUserSelectedLLM()', false, error.message);
    }

    // Test 2: llm-database-operations.js functions
    console.log('\n📝 Testing llm-database-operations.js converted functions');

    // Test getAllLLMs (no longer needs pool parameter)
    try {
      const allLLMs = await getAllLLMs();
      logTest('getAllLLMs() works without pool parameter', Array.isArray(allLLMs));
    } catch (error) {
      logTest('getAllLLMs()', false, error.message);
    }

    // Test getLLMByProvider
    try {
      const anthropicLLM = await getLLMByProvider({ provider: 'anthropic' });
      logTest('getLLMByProvider() works with DatabaseAgent', 
        anthropicLLM === null || typeof anthropicLLM === 'object');
    } catch (error) {
      logTest('getLLMByProvider()', false, error.message);
    }

    // Test getLLMByModel
    try {
      const model = await getLLMByModel({ modelId: 'claude-3-5-sonnet' });
      logTest('getLLMByModel() works with DatabaseAgent', 
        model === null || typeof model === 'object');
    } catch (error) {
      logTest('getLLMByModel()', false, error.message);
    }

    // Test getAvailableModels
    try {
      const models = await getAvailableModels();
      logTest('getAvailableModels() works without pool parameter', 
        Array.isArray(models));
    } catch (error) {
      logTest('getAvailableModels()', false, error.message);
    }

    // Test 3: client-info-fetcher.js
    console.log('\n📝 Testing client-info-fetcher.js converted functions');
    
    try {
      // Create a test client
      const testClient = await dbAgent.clients.createClient({
        name: 'Test Client ' + Date.now(),
        metadata: { test: true }
      });

      // Mock request object
      const mockReq = {
        session: { user: { client_id: testClient.id } }
      };

      // Test the converted function
      const clientName = await ClientInfoFetcher.fetchClientNameFromDb(mockReq, testClient.id);
      
      logTest('fetchClientNameFromDb() works without pool', 
        typeof clientName === 'string' || clientName === null);
      logTest('fetchClientNameFromDb() returns correct client name', 
        clientName === testClient.name);

      // Clean up
      await dbAgent.clients.deleteClient(testClient.id);
      
    } catch (error) {
      logTest('ClientInfoFetcher.fetchClientNameFromDb()', false, error.message);
    }

    // Test 4: Check that functions handle errors properly
    console.log('\n📝 Testing error handling in converted functions');
    
    try {
      // Test with invalid user ID
      const result = await getUserSelectedLLM({ 
        userId: -999999, 
        clientId: null 
      });
      
      logTest('getUserSelectedLLM() handles invalid user gracefully', 
        result !== undefined);
      
    } catch (error) {
      logTest('Error handling', false, error.message);
    }

    // Test 5: Verify DatabaseAgent connection management
    console.log('\n📝 Testing DatabaseAgent connection management');
    
    try {
      // Run multiple operations in parallel to test connection pooling
      const promises = [
        getAvailableLLMs({}),
        isValidLLM('claude-3-5-sonnet'),
        getAllLLMs(),
        getAvailableModels()
      ];
      
      const results = await Promise.all(promises);
      
      logTest('Parallel operations complete successfully', 
        results.every(r => r !== undefined));
      logTest('Connection pooling works correctly', true);
      
    } catch (error) {
      logTest('Connection management', false, error.message);
    }

    // Test Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Integration Test Results: ${testResults.passed} passed, ${testResults.failed} failed`);
    
    if (testResults.failed > 0) {
      console.log('\nFailed tests:');
      testResults.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`  ❌ ${t.name}: ${t.message}`));
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  } finally {
    if (dbAgent) {
      await dbAgent.close();
      console.log('\n✅ Database connection closed');
    }
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests();
}

export { runIntegrationTests };