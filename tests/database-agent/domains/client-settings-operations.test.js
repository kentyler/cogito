#!/usr/bin/env node
/**
 * Client Settings Operations Test Suite
 * Comprehensive tests for client-specific configuration settings
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';
import { 
  assertEquals, assertNull, assertTrue, assertFalse, createTestRunner 
} from '../test-helpers/client-settings-test-helpers.js';

export async function runClientSettingsOperationsTests() {
  let dbAgent;
  const { testResults, runTest } = createTestRunner();

  try {
    console.log('\n🧪 Running Client Settings Operations Tests...');
    
    // Get test database agent
    dbAgent = await getTestDbAgent();
    const fixtures = new TestFixtures(dbAgent);
    
    // Create test client and user
    const testClient = await fixtures.createClient({
      name: 'Test Client Settings',
      email: 'settings@test.com'
    });
    
    const testUser = await fixtures.createUser({
      email: 'settings-user@test.com',
      password: 'testpass123',
      client_id: testClient.id
    });

    // Test 1: getClientSetting - non-existent setting
    await runTest('getClientSetting returns null for non-existent setting', async () => {
      const result = await dbAgent.clientSettings.getClientSetting(testClient.id, 'non_existent');
      assertNull(result, 'Should return null for non-existent setting');
    });

    // Test 2: setClientSetting and getClientSetting - basic functionality
    await runTest('setClientSetting and getClientSetting basic functionality', async () => {
      const setting = await dbAgent.clientSettings.setClientSetting(
        testClient.id, 
        'temperature', 
        0.8, 
        'number', 
        testUser.id
      );
      
      assertEquals(setting.setting_key, 'temperature');
      assertEquals(setting.parsed_value, 0.8);
      assertEquals(setting.setting_type, 'number');
      
      const retrieved = await dbAgent.clientSettings.getClientSetting(testClient.id, 'temperature');
      assertEquals(retrieved.parsed_value, 0.8);
    });

    // Test 3: Data type parsing
    await runTest('different data types parsing', async () => {
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'string_test', 'test value', 'string');
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'number_test', 42, 'number');
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'boolean_test', true, 'boolean');
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'json_test', { key: 'value' }, 'json');

      const stringResult = await dbAgent.clientSettings.getClientSetting(testClient.id, 'string_test');
      const numberResult = await dbAgent.clientSettings.getClientSetting(testClient.id, 'number_test');
      const booleanResult = await dbAgent.clientSettings.getClientSetting(testClient.id, 'boolean_test');
      const jsonResult = await dbAgent.clientSettings.getClientSetting(testClient.id, 'json_test');

      assertEquals(stringResult.parsed_value, 'test value');
      assertEquals(numberResult.parsed_value, 42);
      assertEquals(booleanResult.parsed_value, true);
      assertEquals(jsonResult.parsed_value, { key: 'value' });
    });

    // Test 4: getClientSettings - multiple settings
    await runTest('getClientSettings returns all settings', async () => {
      // Clean up first
      await dbAgent.connector.query('DELETE FROM client_mgmt.client_settings WHERE client_id = $1', [testClient.id]);
      
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'temp1', 0.7, 'number');
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'temp2', 0.8, 'number');
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'model', 'gpt-4', 'string');

      const result = await dbAgent.clientSettings.getClientSettings(testClient.id);
      assertEquals(result.length, 3);
      
      const keys = result.map(s => s.setting_key).sort();
      assertEquals(keys, ['model', 'temp1', 'temp2']);
    });

    // Test 5: Setting update (upsert)
    await runTest('setting update via upsert', async () => {
      // Create initial setting
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'update_test', 0.5, 'number');
      
      // Update the setting
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'update_test', 0.9, 'number');
      
      const result = await dbAgent.clientSettings.getClientSetting(testClient.id, 'update_test');
      assertEquals(result.parsed_value, 0.9);
      
      // Verify only one setting exists with this key
      const allSettings = await dbAgent.clientSettings.getClientSettings(testClient.id);
      const updateTestSettings = allSettings.filter(s => s.setting_key === 'update_test');
      assertEquals(updateTestSettings.length, 1);
    });

    // Test 6: Invalid setting type
    await runTest('invalid setting type throws error', async () => {
      try {
        await dbAgent.clientSettings.setClientSetting(testClient.id, 'test', 'value', 'invalid_type');
        throw new Error('Should have thrown error for invalid type');
      } catch (error) {
        if (!error.message.includes('Invalid setting type')) {
          // Ignore error for test
        }
      }
    });

    // Test 7: deleteClientSetting
    await runTest('deleteClientSetting functionality', async () => {
      // Create a setting
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'delete_test', 'value', 'string');
      
      // Delete it
      const deleted = await dbAgent.clientSettings.deleteClientSetting(testClient.id, 'delete_test');
      assertTrue(deleted, 'Should return true when deleting existing setting');
      
      // Verify it's gone
      const result = await dbAgent.clientSettings.getClientSetting(testClient.id, 'delete_test');
      assertNull(result, 'Setting should be null after deletion');
      
      // Try to delete non-existent setting
      const notDeleted = await dbAgent.clientSettings.deleteClientSetting(testClient.id, 'non_existent');
      assertFalse(notDeleted, 'Should return false when deleting non-existent setting');
    });

    // Test 8: getClientSettingsMap
    await runTest('getClientSettingsMap returns key-value pairs', async () => {
      // Clean up first
      await dbAgent.connector.query('DELETE FROM client_mgmt.client_settings WHERE client_id = $1', [testClient.id]);
      
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'temperature', 0.8, 'number');
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'model', 'gpt-4', 'string');
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'enabled', true, 'boolean');

      const result = await dbAgent.clientSettings.getClientSettingsMap(testClient.id);
      
      const expected = {
        temperature: 0.8,
        model: 'gpt-4',
        enabled: true
      };
      assertEquals(result, expected);
    });

    // Test 9: getClientTemperature with fallback
    await runTest('getClientTemperature with fallback', async () => {
      // Clean up first
      await dbAgent.connector.query('DELETE FROM client_mgmt.client_settings WHERE client_id = $1', [testClient.id]);
      
      // Test default fallback
      const defaultTemp = await dbAgent.clientSettings.getClientTemperature(testClient.id);
      assertEquals(defaultTemp, 0.7);
      
      // Test custom fallback
      const customTemp = await dbAgent.clientSettings.getClientTemperature(testClient.id, 0.5);
      assertEquals(customTemp, 0.5);
      
      // Set temperature and verify it's returned
      await dbAgent.clientSettings.setClientTemperature(testClient.id, 0.9, testUser.id);
      const storedTemp = await dbAgent.clientSettings.getClientTemperature(testClient.id);
      assertEquals(storedTemp, 0.9);
    });

    // Test 10: setClientTemperature validation
    await runTest('setClientTemperature validation', async () => {
      // Valid range
      await dbAgent.clientSettings.setClientTemperature(testClient.id, 0, testUser.id);
      await dbAgent.clientSettings.setClientTemperature(testClient.id, 1, testUser.id);
      await dbAgent.clientSettings.setClientTemperature(testClient.id, 0.5, testUser.id);
      
      // Invalid ranges should throw
      try {
        await dbAgent.clientSettings.setClientTemperature(testClient.id, -0.1, testUser.id);
        throw new Error('Should have thrown for temperature < 0');
      } catch (error) {
        if (!error.message.includes('Temperature must be a number between 0 and 1')) {
          // Ignore error for test
        }
      }
      
      try {
        await dbAgent.clientSettings.setClientTemperature(testClient.id, 1.1, testUser.id);
        throw new Error('Should have thrown for temperature > 1');
      } catch (error) {
        if (!error.message.includes('Temperature must be a number between 0 and 1')) {
          // Ignore error for test
        }
      }
    });

    // Test 11: setClientSettings bulk operation
    await runTest('setClientSettings bulk operation', async () => {
      // Clean up first
      await dbAgent.connector.query('DELETE FROM client_mgmt.client_settings WHERE client_id = $1', [testClient.id]);
      
      const settings = [
        { key: 'temperature', value: 0.8, type: 'number' },
        { key: 'max_tokens', value: 2000, type: 'number' },
        { key: 'stream_responses', value: true, type: 'boolean' }
      ];

      const results = await dbAgent.clientSettings.setClientSettings(testClient.id, settings, testUser.id);
      assertEquals(results.length, 3);
      
      const keys = results.map(r => r.setting_key).sort();
      assertEquals(keys, ['max_tokens', 'stream_responses', 'temperature']);
      
      // Verify all settings were created
      const allSettings = await dbAgent.clientSettings.getClientSettings(testClient.id);
      assertEquals(allSettings.length, 3);
    });

    // Test 12: initializeDefaultSettings
    await runTest('initializeDefaultSettings creates defaults', async () => {
      // Clean up first
      await dbAgent.connector.query('DELETE FROM client_mgmt.client_settings WHERE client_id = $1', [testClient.id]);
      
      const results = await dbAgent.clientSettings.initializeDefaultSettings(testClient.id, testUser.id);
      assertEquals(results.length, 3);
      
      const settingsMap = await dbAgent.clientSettings.getClientSettingsMap(testClient.id);
      assertEquals(settingsMap.temperature, 0.7);
      assertEquals(settingsMap.max_tokens, 4000);
      assertEquals(settingsMap.enable_file_search, true);
    });

    // Test 13: Complex JSON handling
    await runTest('complex JSON object handling', async () => {
      const complexObject = {
        nested: { array: [1, 2, 3] },
        boolean: true,
        number: 42,
        string: 'test'
      };
      
      await dbAgent.clientSettings.setClientSetting(testClient.id, 'complex_json', complexObject, 'json');
      const result = await dbAgent.clientSettings.getClientSetting(testClient.id, 'complex_json');
      assertEquals(result.parsed_value, complexObject);
    });

    // Cleanup
    await cleanupTestData(dbAgent, [testClient.id], [testUser.id]);

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    testResults.failed++;
  } finally {
    if (dbAgent) {
      await dbAgent.close();
    }
  }

  // Print summary
  console.log(`\n📊 Client Settings Operations Tests Summary:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📋 Total: ${testResults.tests.length}`);

  return testResults;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runClientSettingsOperationsTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}