#!/usr/bin/env node
/**
 * DesignGamesOperations Test Suite - Validates design games functionality
 * Tests all core design games operations functionality
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

async function runDesignGamesOperationsTests() {
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
    console.log('🧪 Running DesignGamesOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Create test client and user
    const testData = await TestFixtures.createTestClient(dbAgent);
    const testUser = await TestFixtures.createTestUser(dbAgent);
    const clientId = testData.id;
    const userId = testUser.id;

    // Test game management operations
    console.log('🎮 Testing game management...');
    
    const gameData = {
      name: 'Test Design Game',
      ude: 'Test UDE for design game',
      initialCards: { 'test-card': 'Test Card Value' }
    };
    
    try {
      const game = await dbAgent.designGames.createGame(clientId, gameData.name, gameData.ude, gameData.initialCards);
      logTest('createGame() works', !!game);
    } catch (error) {
      logTest('createGame() works', false, `Error: ${error.message}`);
    }
    
    try {
      const loadedGame = await dbAgent.designGames.loadGame(clientId, gameData.name);
      logTest('loadGame() works', !!loadedGame);
    } catch (error) {
      logTest('loadGame() works', false, `Error: ${error.message}`);
    }
    
    try {
      const gamesList = await dbAgent.designGames.listGames(clientId);
      logTest('listGames() works', Array.isArray(gamesList));
    } catch (error) {
      logTest('listGames() works', false, `Error: ${error.message}`);
    }
    
    try {
      const statusUpdate = await dbAgent.designGames.updateGameStatus(clientId, gameData.name, 'active', 'Game is now active');
      logTest('updateGameStatus() works', !!statusUpdate || statusUpdate === null);
    } catch (error) {
      logTest('updateGameStatus() works', false, `Error: ${error.message}`);
    }

    // Test card management operations
    console.log('🃏 Testing card management...');
    
    try {
      const allCards = await dbAgent.designGames.getAllCards(clientId);
      logTest('getAllCards() works', Array.isArray(allCards));
    } catch (error) {
      logTest('getAllCards() works', false, `Error: ${error.message}`);
    }
    
    try {
      const searchResults = await dbAgent.designGames.findCards(clientId, 'test');
      logTest('findCards() works', Array.isArray(searchResults));
    } catch (error) {
      logTest('findCards() works', false, `Error: ${error.message}`);
    }
    
    try {
      const newCards = { 'new-card': 'New Card Value' };
      const addResult = await dbAgent.designGames.addCards(clientId, gameData.name, newCards);
      logTest('addCards() works', !!addResult || addResult === null);
    } catch (error) {
      logTest('addCards() works', false, `Error: ${error.message}`);
    }

    // Test hand tracking operations
    console.log('✋ Testing hand tracking...');
    
    try {
      const handData = {
        cards: ['card1', 'card2', 'card3'],
        outcome: 'win',
        notes: 'Test hand notes'
      };
      const handResult = await dbAgent.designGames.recordHand(clientId, gameData.name, handData.cards, handData.outcome, handData.notes);
      logTest('recordHand() works', !!handResult || handResult === null);
    } catch (error) {
      logTest('recordHand() works', false, `Error: ${error.message}`);
    }
    
    try {
      const successfulCombos = await dbAgent.designGames.getSuccessfulCombinations(clientId);
      logTest('getSuccessfulCombinations() works', Array.isArray(successfulCombos));
    } catch (error) {
      logTest('getSuccessfulCombinations() works', false, `Error: ${error.message}`);
    }

    // Test UDE analysis operations
    console.log('🔍 Testing UDE analysis...');
    
    try {
      const similarUDEs = await dbAgent.designGames.findSimilarUDEs(clientId, gameData.ude, 5);
      logTest('findSimilarUDEs() works', Array.isArray(similarUDEs));
    } catch (error) {
      logTest('findSimilarUDEs() works', false, `Error: ${error.message}`);
    }

    console.log(`\n📊 Test Results: ✅ ${testResults.passed} passed, ❌ ${testResults.failed} failed`);
    
    if (testResults.failed === 0) {
      console.log('🎉 All DesignGamesOperations tests passed!');
    } else {
      console.log('⚠️  Some tests failed - this may be due to missing database schema');
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
  runDesignGamesOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runDesignGamesOperationsTests };