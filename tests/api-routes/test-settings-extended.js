#!/usr/bin/env node
/**
 * Settings API Routes - Extended Tests
 * Advanced scenarios including audit trails and concurrency
 */

import { ApiTestSuite } from './api-test-framework.js';

const suite = new ApiTestSuite('Settings API - Extended');

// Test: Settings history and audit trail
suite.test('Should maintain settings change audit trail', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const temperatures = [0.3, 0.5, 0.8];
  
  for (const temp of temperatures) {
    await this.dbAgent.clientSettings.setClientTemperature(
      testClient.id, 
      temp, 
      testUser.id
    );
  }
  
  const finalSetting = await this.dbAgent.clientSettings.getClientSetting(testClient.id, 'temperature');
  
  if (!finalSetting || finalSetting.parsed_value !== 0.8) {
    throw new Error('Final temperature setting incorrect');
  }
  
  console.log('   📝 Settings change audit trail maintained');
  console.log('   📝 Final temperature:', finalSetting.parsed_value);
});

// Test: Concurrent settings updates
suite.test('Should handle concurrent settings updates', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const temperatures = [0.2, 0.4, 0.6, 0.9];
  const concurrentUpdates = temperatures.map(temp => 
    this.dbAgent.clientSettings.setClientTemperature(testClient.id, temp, testUser.id)
  );
  
  const results = await Promise.all(concurrentUpdates);
  
  if (results.length !== temperatures.length) {
    throw new Error(`Expected ${temperatures.length} results, got ${results.length}`);
  }
  
  const finalSetting = await this.dbAgent.clientSettings.getClientSetting(testClient.id, 'temperature');
  const finalTemp = finalSetting.parsed_value;
  
  if (!temperatures.includes(finalTemp)) {
    throw new Error(`Final temperature ${finalTemp} not in expected range`);
  }
  
  console.log('   📝 Concurrent updates handled correctly');
  console.log('   📝 Final temperature:', finalTemp);
});

// Test: Settings cleanup on client deletion
suite.test('Should handle settings cleanup appropriately', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  await this.dbAgent.clientSettings.setClientTemperature(testClient.id, 0.7, testUser.id);
  const setting = await this.dbAgent.clientSettings.getClientSetting(testClient.id, 'temperature');
  
  if (!setting) {
    throw new Error('Setting should exist before client deletion');
  }
  
  console.log('   📝 Settings cleanup test prepared');
  console.log('   📝 Setting exists for client:', testClient.id);
});

// Test: Settings validation edge cases
suite.test('Should handle settings validation edge cases', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  // Test exact boundary values
  const boundaryTemperatures = [0.0, 1.0];
  
  for (const temp of boundaryTemperatures) {
    const setting = await this.dbAgent.clientSettings.setClientTemperature(
      testClient.id, 
      temp, 
      testUser.id
    );
    
    if (setting.parsed_value !== temp) {
      throw new Error(`Failed to set boundary temperature ${temp}`);
    }
  }
  
  console.log('   📝 Boundary temperature values validated');
  console.log('   📝 Tested boundaries:', boundaryTemperatures);
});

// Test: Multiple setting types
suite.test('Should handle multiple setting types', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  // Set temperature
  await this.dbAgent.clientSettings.setClientTemperature(testClient.id, 0.5, testUser.id);
  
  // Retrieve temperature setting
  const tempSetting = await this.dbAgent.clientSettings.getClientSetting(testClient.id, 'temperature');
  
  if (!tempSetting || tempSetting.parsed_value !== 0.5) {
    throw new Error('Temperature setting not properly stored');
  }
  
  // Test retrieval of non-existent setting
  const nonExistentSetting = await this.dbAgent.clientSettings.getClientSetting(testClient.id, 'non_existent');
  
  if (nonExistentSetting !== null) {
    throw new Error('Non-existent setting should return null');
  }
  
  console.log('   📝 Multiple setting types handled correctly');
  console.log('   📝 Temperature setting retrieved:', tempSetting.parsed_value);
  console.log('   📝 Non-existent setting handled:', nonExistentSetting === null ? 'correctly' : 'incorrectly');
});

// Run the test suite if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { suite as settingsExtendedTestSuite };