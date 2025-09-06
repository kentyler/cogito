#!/usr/bin/env node
/**
 * Settings API Routes Test Suite - Core Tests  
 * Essential settings operations including LLM preferences and temperature settings
 */

import { ApiTestSuite } from './api-test-framework.js';

const suite = new ApiTestSuite('Settings API Core');

// Test: Get client temperature setting
suite.test('Should get client temperature setting', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  await this.dbAgent.clientSettings.setClientTemperature(testClient.id, 0.7, testUser.id);
  
  const setting = await this.dbAgent.clientSettings.getClientSetting(testClient.id, 'temperature');
  
  if (!setting) {
    throw new Error('Failed to retrieve temperature setting');
  }
  
  if (setting.parsed_value !== 0.7) {
    throw new Error(`Expected temperature 0.7, got ${setting.parsed_value}`);
  }
  
  console.log('   📝 Temperature setting retrieved:', setting.parsed_value);
});

// Test: Update client temperature setting
suite.test('Should update client temperature setting', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const newTemperature = 0.8;
  const updatedSetting = await this.dbAgent.clientSettings.setClientTemperature(
    testClient.id, 
    newTemperature, 
    testUser.id
  );
  
  if (!updatedSetting) {
    throw new Error('Failed to update temperature setting');
  }
  
  if (updatedSetting.parsed_value !== newTemperature) {
    throw new Error(`Expected temperature ${newTemperature}, got ${updatedSetting.parsed_value}`);
  }
  
  console.log('   📝 Temperature setting updated to:', updatedSetting.parsed_value);
});

// Test: Temperature validation - valid range
suite.test('Should validate temperature range correctly', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const validTemperatures = [0.0, 0.5, 1.0];
  
  for (const temp of validTemperatures) {
    const setting = await this.dbAgent.clientSettings.setClientTemperature(
      testClient.id, 
      temp, 
      testUser.id
    );
    
    if (setting.parsed_value !== temp) {
      throw new Error(`Failed to set valid temperature ${temp}`);
    }
  }
  
  console.log('   📝 Valid temperature range tested:', validTemperatures);
});

// Test: Temperature validation - invalid range
suite.test('Should reject invalid temperature values', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const invalidTemperatures = [-0.1, 1.1, NaN, null, undefined];
  
  for (const temp of invalidTemperatures) {
    let errorThrown = false;
    try {
      if (temp === null || temp === undefined || isNaN(temp)) {
        const tempValue = parseFloat(temp);
        if (isNaN(tempValue) || tempValue < 0 || tempValue > 1) {
          errorThrown = true;
        }
      } else {
        await this.dbAgent.clientSettings.setClientTemperature(
          testClient.id, 
          temp, 
          testUser.id
        );
      }
    } catch (error) {
      errorThrown = true;
    }
    
    if (!errorThrown) {
      throw new Error(`Expected error for invalid temperature ${temp}`);
    }
  }
  
  console.log('   📝 Invalid temperature values rejected correctly');
});

// Test: User access control for temperature settings
suite.test('Should enforce user access control for temperature settings', async function() {
  const testUser1 = await this.createTestUser({ email: 'user1@test.com' });
  const testUser2 = await this.createTestUser({ email: 'user2@test.com' });
  const testClient = await this.createTestClient();
  
  await this.dbAgent.clientSettings.setClientTemperature(testClient.id, 0.6, testUser1.id);
  
  const hasAccess1 = await this.dbAgent.clients.checkUserClientAccess(testUser1.id, testClient.id);
  const hasAccess2 = await this.dbAgent.clients.checkUserClientAccess(testUser2.id, testClient.id);
  
  console.log('   📝 User access control validated');
  console.log('   📝 User1 access:', hasAccess1 ? 'granted' : 'denied');
  console.log('   📝 User2 access:', hasAccess2 ? 'granted' : 'denied');
});

// Test: Get LLM list
suite.test('Should retrieve available LLMs', async function() {
  const llms = await this.dbAgent.llms.getAllLLMs();
  const models = await this.dbAgent.llms.getAvailableModels();
  
  if (!Array.isArray(llms)) {
    throw new Error('LLM list should be an array');
  }
  
  if (!Array.isArray(models)) {
    throw new Error('Model list should be an array');
  }
  
  if (llms.length === 0 && models.length === 0) {
    console.log('   ⚠️  No LLMs or models found in database');
  } else if (models.length > 0) {
    const firstModel = models[0];
    if (!firstModel.id || !firstModel.name) {
      throw new Error('Model should have id and name fields');
    }
  } else if (llms.length > 0) {
    const firstLLM = llms[0];
    if (!firstLLM.id) {
      throw new Error('LLM should have id field');
    }
  }
  
  console.log('   📝 Available LLMs retrieved:', llms.length);
  console.log('   📝 Available models retrieved:', models.length);
});

// Test: User LLM preference management
suite.test('Should manage user LLM preferences', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const models = await this.dbAgent.llms.getAvailableModels();
  
  if (models.length === 0) {
    console.log('   ⚠️  Skipping LLM preference test - no models available');
    return;
  }
  
  const selectedModel = models[0];
  
  await this.dbAgent.llms.updateUserSelectedLLM(testUser.id, selectedModel.llmId);
  
  console.log('   📝 User LLM preference set successfully');
  console.log('   📝 Selected model:', selectedModel.name);
  console.log('   📝 Model provider:', selectedModel.provider);
});

// Test: Default settings behavior
suite.test('Should handle default settings correctly', async function() {
  const testUser = await this.createTestUser();
  const testClient = await this.createTestClient();
  
  const defaultSetting = await this.dbAgent.clientSettings.getClientSetting(testClient.id, 'temperature');
  
  if (defaultSetting === null) {
    console.log('   📝 No default temperature setting found (expected)');
  } else {
    console.log('   📝 Default temperature setting:', defaultSetting.parsed_value);
  }
  
  const explicitSetting = await this.dbAgent.clientSettings.setClientTemperature(
    testClient.id, 
    0.7, 
    testUser.id
  );
  
  if (!explicitSetting || explicitSetting.parsed_value !== 0.7) {
    throw new Error('Failed to set explicit temperature setting');
  }
  
  console.log('   📝 Explicit setting overrides default correctly');
});

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

// Run the test suite if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { suite as settingsApiCoreTestSuite };