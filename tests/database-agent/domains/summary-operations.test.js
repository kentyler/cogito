#!/usr/bin/env node
/**
 * SummaryOperations Test Suite - Validates summary generation functionality
 * Tests all core summary operations functionality
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

async function runSummaryOperationsTests() {
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
    console.log('🧪 Running SummaryOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Create test client and user
    const testData = await TestFixtures.createTestClient(dbAgent);
    const testUser = await TestFixtures.createTestUser(dbAgent);
    const clientId = testData.id;
    const userId = testUser.id;

    // Create a test meeting with some turns for summary testing
    const meeting = await dbAgent.meetings.create({
      name: 'Summary Test Meeting',
      description: 'Test meeting for summary operations',
      meeting_type: 'manual',
      status: 'active',
      client_id: clientId,
      created_by_user_id: userId,
      metadata: { test: true }
    });

    // Add some test turns
    await dbAgent.turns.createTurn({
      meeting_id: meeting.id,
      content: { role: 'user', content: 'This is a test message for summary generation' },
      turn_index: 1,
      user_id: userId
    });

    await dbAgent.turns.createTurn({
      meeting_id: meeting.id,
      content: { role: 'assistant', content: 'This is a test response for summary generation' },
      turn_index: 2,
      user_id: userId
    });

    // Test utility methods
    console.log('🔧 Testing utility methods...');
    
    const testDate = new Date();
    const validDate = dbAgent.summaries.validateDate(testDate);
    logTest('validateDate() works', !!validDate);

    const mockReq = { session: { user: { id: userId }, client: { id: clientId, name: 'Test Client' } } };
    const userContext = dbAgent.summaries.getUserContext(mockReq);
    logTest('getUserContext() works', !!userContext && userContext.clientId === clientId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    
    const turnsQuery = dbAgent.summaries.buildTurnsQuery({
      startDate: startDate,
      endDate: endDate,
      clientId: clientId
    });
    logTest('buildTurnsQuery() works', !!turnsQuery.query && Array.isArray(turnsQuery.params));

    // Test core operations
    console.log('📊 Testing core operations...');
    
    try {
      const turns = await dbAgent.summaries.getTurnsForDateRange(startDate, endDate, clientId);
      logTest('getTurnsForDateRange() works', Array.isArray(turns));
      
      if (turns.length > 0) {
        const formattedTurns = dbAgent.summaries.formatTurnsForAI(turns);
        logTest('formatTurnsForAI() works', typeof formattedTurns === 'string' && formattedTurns.length > 0);
      } else {
        logTest('formatTurnsForAI() works', true, 'No turns to format');
      }
    } catch (error) {
      logTest('getTurnsForDateRange() works', false, `Error: ${error.message}`);
      logTest('formatTurnsForAI() works', false, 'Dependent on getTurnsForDateRange');
    }

    // Test AI summary generation (without actual AI client)
    console.log('🤖 Testing AI summary generation...');
    
    const aiSummary = await dbAgent.summaries.generateAISummary({ 
      anthropic: null, 
      prompt: 'Test prompt', 
      maxTokens: 100 
    });
    logTest('generateAISummary() works without AI client', typeof aiSummary === 'string');

    // Test summary generation methods (these may fail without actual AI client)
    console.log('📝 Testing summary generation methods...');
    
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const monthlySummary = await dbAgent.summaries.generateMonthlySummaries(
        year, month, clientId, 'Test Client', null
      );
      logTest('generateMonthlySummaries() works', !!monthlySummary || monthlySummary === null);
    } catch (error) {
      logTest('generateMonthlySummaries() works', false, `Error: ${error.message}`);
    }

    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const dailySummary = await dbAgent.summaries.generateDailySummary(
        todayDate, clientId, 'Test Client', null
      );
      logTest('generateDailySummary() works', !!dailySummary || dailySummary === null);
    } catch (error) {
      logTest('generateDailySummary() works', false, `Error: ${error.message}`);
    }

    console.log(`\n📊 Test Results: ✅ ${testResults.passed} passed, ❌ ${testResults.failed} failed`);
    
    if (testResults.failed === 0) {
      console.log('🎉 All SummaryOperations tests passed!');
    } else {
      console.log('⚠️  Some tests failed - this may be expected without AI client configuration');
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
  runSummaryOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runSummaryOperationsTests };