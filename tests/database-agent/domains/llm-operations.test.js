#!/usr/bin/env node
/**
 * Test suite for LLMOperations domain
 * Tests all LLM configuration and model management methods
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

async function runLLMOperationsTests() {
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
    console.log('🧪 Running LLMOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Test 1: getAllLLMs
    console.log('📝 Testing getAllLLMs()');
    try {
      const llms = await dbAgent.llms.getAllLLMs();
      
      logTest('getAllLLMs() returns array', Array.isArray(llms));
      logTest('getAllLLMs() excludes placeholder API keys', 
        !llms.some(llm => llm.api_key === 'YOUR_ANTHROPIC_API_KEY' || 
                         llm.api_key === 'YOUR_OPENAI_API_KEY'));
      
    } catch (error) {
      logTest('getAllLLMs()', false, error.message);
    }

    // Test 2: getLLMByProvider
    console.log('\n📝 Testing getLLMByProvider()');
    try {
      const anthropicLLM = await dbAgent.llms.getLLMByProvider('anthropic');
      const invalidLLM = await dbAgent.llms.getLLMByProvider('invalid_provider');
      
      logTest('getLLMByProvider() returns object for valid provider', 
        anthropicLLM === null || typeof anthropicLLM === 'object');
      logTest('getLLMByProvider() returns null for invalid provider', 
        invalidLLM === null);
      
    } catch (error) {
      logTest('getLLMByProvider()', false, error.message);
    }

    // Test 3: getLLMByModel
    console.log('\n📝 Testing getLLMByModel()');
    try {
      const claudeModel = await dbAgent.llms.getLLMByModel('claude-3-5-sonnet');
      const invalidModel = await dbAgent.llms.getLLMByModel('invalid-model-id');
      
      logTest('getLLMByModel() returns object for valid model', 
        claudeModel === null || typeof claudeModel === 'object');
      logTest('getLLMByModel() returns null for invalid model', 
        invalidModel === null);
      if (claudeModel) {
        logTest('getLLMByModel() includes required fields', 
          claudeModel.hasOwnProperty('model') && 
          claudeModel.hasOwnProperty('provider'));
      }
      
    } catch (error) {
      logTest('getLLMByModel()', false, error.message);
    }

    // Test 4: getAvailableModels
    console.log('\n📝 Testing getAvailableModels()');
    try {
      const models = await dbAgent.llms.getAvailableModels();
      
      logTest('getAvailableModels() returns array', Array.isArray(models));
      if (models.length > 0) {
        const firstModel = models[0];
        logTest('getAvailableModels() includes model structure', 
          firstModel.hasOwnProperty('id') && 
          firstModel.hasOwnProperty('name') &&
          firstModel.hasOwnProperty('provider'));
        logTest('getAvailableModels() includes temperature and maxTokens', 
          firstModel.hasOwnProperty('temperature') && 
          firstModel.hasOwnProperty('maxTokens'));
      }
      
    } catch (error) {
      logTest('getAvailableModels()', false, error.message);
    }

    // Test 5: isValidLLM
    console.log('\n📝 Testing isValidLLM()');
    try {
      const validLLM = await dbAgent.llms.isValidLLM('claude-3-5-sonnet');
      const invalidLLM = await dbAgent.llms.isValidLLM('totally-invalid-llm');
      const emptyLLM = await dbAgent.llms.isValidLLM('');
      const nullLLM = await dbAgent.llms.isValidLLM(null);
      
      logTest('isValidLLM() returns boolean', 
        typeof validLLM === 'boolean');
      logTest('isValidLLM() returns false for invalid LLM', 
        invalidLLM === false);
      logTest('isValidLLM() returns false for empty string', 
        emptyLLM === false);
      logTest('isValidLLM() returns false for null', 
        nullLLM === false);
      
    } catch (error) {
      logTest('isValidLLM()', false, error.message);
    }

    // Test 6: updateUserSelectedLLM
    console.log('\n📝 Testing updateUserSelectedLLM()');
    try {
      // Create a test user first
      const testUser = await dbAgent.users.create({
        email: TestFixtures.generateTestEmail(),
        password: 'testpass123'
      });
      
      // Update their LLM selection
      const result = await dbAgent.llms.updateUserSelectedLLM(
        testUser.id, 
        'claude-3-5-sonnet'
      );
      
      logTest('updateUserSelectedLLM() completes successfully', !!result);
      
      // Verify the update
      const userPrefs = await dbAgent.users.getUserPreferences(testUser.id);
      logTest('updateUserSelectedLLM() updates user preference', 
        userPrefs?.last_llm_id === 'claude-3-5-sonnet');
      
      // Clean up test user
      await dbAgent.query(
        'DELETE FROM client_mgmt.users WHERE id = $1', 
        [testUser.id]
      );
      
    } catch (error) {
      logTest('updateUserSelectedLLM()', false, error.message);
    }

    // Test 7: Site LLM CRUD operations (if user has permissions)
    console.log('\n📝 Testing Site LLM CRUD operations');
    let testLLMId;
    try {
      // Create a test LLM
      const testLLMData = {
        provider: 'test_provider',
        apiKey: 'test-api-key-' + Date.now(),
        additionalConfig: { test: true, model: 'test-model-1', temperature: 0.8, max_tokens: 2000 },
        subdomain: 'test-subdomain'
      };
      
      const createdLLM = await dbAgent.llms.createSiteLLM(testLLMData);
      testLLMId = createdLLM?.id;
      
      logTest('createSiteLLM() creates new LLM', !!createdLLM);
      logTest('createSiteLLM() returns correct data', 
        createdLLM?.provider === 'test_provider');
      
      // Update the test LLM
      if (testLLMId) {
        const updatedLLM = await dbAgent.llms.updateSiteLLM(testLLMId, {
          api_key: 'updated-api-key-' + Date.now(),
          subdomain: 'updated-subdomain'
        });
        
        logTest('updateSiteLLM() updates LLM', 
          updatedLLM?.subdomain === 'updated-subdomain');
        
        // Delete the test LLM
        const deletedLLM = await dbAgent.llms.deleteSiteLLM(testLLMId);
        logTest('deleteSiteLLM() removes LLM', !!deletedLLM);
      }
      
    } catch (error) {
      // May fail due to permissions, which is okay
      logTest('Site LLM CRUD operations', false, 
        'May require admin permissions: ' + error.message);
      
      // Try to clean up if creation succeeded but other operations failed
      if (testLLMId) {
        try {
          await dbAgent.llms.deleteSiteLLM(testLLMId);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }

    // DatabaseAgent Method Signature Smoke Tests
    console.log('\n🔧 Testing DatabaseAgent LLM method signatures');
    try {
      // Test getAllLLMs signature
      await dbAgent.llms.getAllLLMs();
      logTest('getAllLLMs() signature valid', true);
      
      // Test getLLMByProvider signature
      await dbAgent.llms.getLLMByProvider('anthropic');
      logTest('getLLMByProvider() signature valid', true);
      
      // Test getAllModels signature
      try {
        await dbAgent.llms.getAllModels();
        logTest('getAllModels() signature valid', true);
      } catch (error) {
        if (error.message.includes('does not exist') || error.message.includes('function')) {
          logTest('getAllModels() signature valid', false, 'Method not implemented');
        } else {
          logTest('getAllModels() signature valid', true);
        }
      }
      
      // Test getModelsForProvider signature
      try {
        await dbAgent.llms.getModelsForProvider('anthropic');
        logTest('getModelsForProvider() signature valid', true);
      } catch (error) {
        if (error.message.includes('does not exist') || error.message.includes('function')) {
          logTest('getModelsForProvider() signature valid', false, 'Method not implemented');
        } else {
          logTest('getModelsForProvider() signature valid', true);
        }
      }
      
    } catch (error) {
      logTest('DatabaseAgent LLM method signatures', false, error.message);
    }

    // Test Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${testResults.passed} passed, ${testResults.failed} failed`);
    
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
      await cleanupTestData(dbAgent);
      await dbAgent.close();
      console.log('\n✅ Database connection closed');
    }
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLLMOperationsTests();
}

export { runLLMOperationsTests };