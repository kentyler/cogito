#!/usr/bin/env node
/**
 * TurnOperations Test Suite - Validates conversation turn management
 * Tests all core turn operations functionality
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

async function runTurnOperationsTests() {
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
    console.log('🧪 Running TurnOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Create test data
    const testData = await TestFixtures.createTestMeeting(dbAgent);
    const meeting = testData.meeting;
    const user = testData.testUser;

    // Test turn creation
    console.log('📝 Testing turn creation...');
    
    const turnData = {
      user_id: user.id,
      content: 'This is a test turn',
      source_type: 'user',
      meeting_id: meeting.id,
      metadata: { test: true }
    };
    
    const turn = await dbAgent.turns.createTurn(turnData);
    logTest('createTurn() works', !!turn && !!turn.id);
    
    // Test turn retrieval
    console.log('🔍 Testing turn retrieval...');
    
    const foundTurn = await dbAgent.turns.getById(turn.id);
    logTest('getById() works', !!foundTurn && foundTurn.id === turn.id);
    
    const meetingTurns = await dbAgent.turns.getByMeetingId(meeting.id);
    logTest('getByMeetingId() works', Array.isArray(meetingTurns) && meetingTurns.length > 0);
    
    // Test turn operations
    console.log('🔄 Testing turn operations...');
    
    const updatedTurn = await dbAgent.turns.updateEmbedding(turn.id, '[0.1, 0.2, 0.3]');
    logTest('updateEmbedding() works', !!updatedTurn);
    
    // Test statistics (skip vector operations due to setup complexity)
    console.log('📊 Testing statistics...');
    
    const globalStats = await dbAgent.turns.getEmbeddingStats();
    logTest('getEmbeddingStats() global works', !!globalStats && typeof globalStats.total_turns === 'number');
    
    const meetingStats = await dbAgent.turns.getEmbeddingStats(meeting.id);
    logTest('getEmbeddingStats() meeting works', !!meetingStats && typeof meetingStats.total_turns === 'number');
    
    // Test vector search methods exist (skip actual execution due to vector setup)
    logTest('findSimilarTurns() method exists', typeof dbAgent.turns.findSimilarTurns === 'function');
    logTest('searchBySimilarity() method exists', typeof dbAgent.turns.searchBySimilarity === 'function');
    
    // Test cleanup operations
    console.log('🗑️ Testing cleanup operations...');
    
    const deletedTurn = await dbAgent.turns.delete(turn.id);
    logTest('delete() works', !!deletedTurn);
    
    // Verify deletion
    const notFound = await dbAgent.turns.getById(turn.id);
    logTest('delete() removes turn from database', notFound === null);
    
    // Test bulk delete
    await dbAgent.turns.createTurn({
      user_id: user.id,
      content: 'Turn for bulk delete',
      source_type: 'user',
      meeting_id: meeting.id,
      metadata: { test: true }
    });
    
    const deleteCount = await dbAgent.turns.deleteByMeetingId(meeting.id);
    logTest('deleteByMeetingId() works', typeof deleteCount === 'number' && deleteCount >= 1);

    console.log(`\n📊 Test Results: ✅ ${testResults.passed} passed, ❌ ${testResults.failed} failed`);
    
    if (testResults.failed === 0) {
      console.log('🎉 All TurnOperations tests passed!');
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
  runTurnOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runTurnOperationsTests };