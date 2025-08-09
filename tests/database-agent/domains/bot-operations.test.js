#!/usr/bin/env node
/**
 * BotOperations Test Suite - Validates bot lifecycle management
 * Tests all core bot operations functionality
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

async function runBotOperationsTests() {
  let dbAgent;
  let testResults = { passed: 0, failed: 0, tests: [] };

  function logTest(name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}${message ? ' - ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }

  try {
    console.log('🧪 Running BotOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Create test bot meetings
    const testData = await TestFixtures.createTestClient(dbAgent);
    const testUser = await TestFixtures.createTestUser(dbAgent);
    const clientId = testData.id;
    const userId = testUser.id;

    // Test bot meeting creation and status management
    const testBotId1 = 'test-bot-001';
    const testBotId2 = 'test-bot-002';

    await dbAgent.meetings.create({
      name: 'Active Bot Meeting',
      description: 'Test active bot',
      meeting_type: 'recall_bot',
      status: 'active',
      recall_bot_id: testBotId1,
      client_id: clientId,
      created_by_user_id: userId,
      meeting_url: 'https://example.com/meeting1',
      metadata: { test: true }
    });

    await dbAgent.meetings.create({
      name: 'Stuck Bot Meeting', 
      description: 'Test stuck bot',
      meeting_type: 'recall_bot',
      status: 'joining',
      recall_bot_id: testBotId2,
      client_id: clientId,
      created_by_user_id: userId,
      meeting_url: 'https://example.com/meeting2',
      metadata: { test: true }
    });

    // Test core functionality
    console.log('🟢 Testing bot operations...');
    
    const activeBots = await dbAgent.bots.getActiveBots();
    logTest('getActiveBots() works', Array.isArray(activeBots) && activeBots.length > 0);
    
    const stuckMeetings = await dbAgent.bots.getStuckMeetings();
    logTest('getStuckMeetings() works', Array.isArray(stuckMeetings) && stuckMeetings.length > 0);
    
    const botMeeting = await dbAgent.bots.getBotMeeting(testBotId1);
    logTest('getBotMeeting() works', !!botMeeting && botMeeting.bot_id === testBotId1);
    
    const stats = await dbAgent.bots.getBotStats();
    logTest('getBotStats() works', !!stats && stats.total_bot_meetings >= 2);
    
    const statusBots = await dbAgent.bots.getBotsByStatus('active');
    logTest('getBotsByStatus() works', Array.isArray(statusBots));
    
    // Test status transitions
    console.log('🔄 Testing status transitions...');
    
    const leavingBot = await dbAgent.bots.setBotStatusLeaving(testBotId1);
    logTest('setBotStatusLeaving() works', !leavingBot || leavingBot.status === 'leaving');
    
    const inactiveBot = await dbAgent.bots.setBotStatusInactive(testBotId1);  
    logTest('setBotStatusInactive() works', !inactiveBot || inactiveBot.status === 'inactive');
    
    const completedBot = await dbAgent.bots.forceCompleteMeeting(testBotId2);
    logTest('forceCompleteMeeting() works', !completedBot || completedBot.status === 'completed');
    
    const customStatus = await dbAgent.bots.updateMeetingStatus(testBotId2, 'custom');
    logTest('updateMeetingStatus() works', !customStatus || customStatus.status === 'custom');

    console.log(`\n📊 Test Results: ✅ ${testResults.passed} passed, ❌ ${testResults.failed} failed`);
    
    if (testResults.failed === 0) {
      console.log('🎉 All BotOperations tests passed!');
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
    testResults.failed++;
  } finally {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
      console.log('🧹 Test cleanup completed');
    }
  }

  return testResults;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBotOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runBotOperationsTests };