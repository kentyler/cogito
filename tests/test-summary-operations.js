/**
 * Test suite for SummaryOperations database agent module
 */

import { SummaryOperations } from '../lib/database-agent/domains/summary-operations.js';
import { DatabaseConnector } from '../lib/database-agent/core/database-connector.js';

// Mock connector for testing
class MockDatabaseConnector {
  constructor() {
    this.queryResults = {};
    this.queryCalls = [];
  }

  setQueryResult(query, result) {
    this.queryResults[query] = result;
  }

  async query(sql, params) {
    this.queryCalls.push({ sql, params });
    
    // Return mock data based on query patterns
    if (sql.includes('meetings.turns')) {
      return this.queryResults['turns'] || { rows: [] };
    }
    
    return { rows: [] };
  }

  async connect() {
    return true;
  }

  async close() {
    return true;
  }
}

// Mock Anthropic client
class MockAnthropic {
  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
    this.messages = {
      create: async (options) => {
        if (this.shouldFail) {
          throw new Error('API Error');
        }
        
        return {
          content: [{ text: 'Mock AI summary of the conversations.' }]
        };
      }
    };
  }
}

/**
 * Test helper functions
 */
function createMockTurns(count = 3) {
  const turns = [];
  const baseDate = new Date('2024-01-15T10:00:00Z');
  
  for (let i = 0; i < count; i++) {
    turns.push({
      id: `turn-${i + 1}`,
      content: `This is turn ${i + 1} content`,
      source_type: i % 2 === 0 ? 'user_message' : 'llm_response',
      created_at: new Date(baseDate.getTime() + i * 60000),
      metadata: {},
      email: i % 2 === 0 ? 'test@example.com' : null
    });
  }
  
  return turns;
}

function createMockRequest(sessionData = {}) {
  return {
    session: {
      user: {
        user_id: 1,
        client_id: 101,
        client_name: 'Test Client',
        ...sessionData
      }
    }
  };
}

/**
 * Test suite
 */
async function runTests() {
  console.log('🧪 Starting SummaryOperations tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  function test(name, testFn) {
    totalTests++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }
  
  async function asyncTest(name, testFn) {
    totalTests++;
    try {
      await testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  // Setup
  const mockConnector = new MockDatabaseConnector();
  const summaryOps = new SummaryOperations(mockConnector);
  
  // Test 1: Date validation
  test('validateDate should accept valid dates', () => {
    if (!summaryOps.validateDate('2024-01-15')) {
      throw new Error('Should accept valid date format');
    }
    if (summaryOps.validateDate('2024-1-15')) {
      throw new Error('Should reject invalid date format');
    }
    if (summaryOps.validateDate('not-a-date')) {
      throw new Error('Should reject non-date string');
    }
  });

  // Test 2: User context extraction
  test('getUserContext should extract session data correctly', () => {
    const req = createMockRequest();
    const context = summaryOps.getUserContext(req);
    
    if (context.user_id !== 1) {
      throw new Error('Should extract user_id');
    }
    if (context.client_id !== 101) {
      throw new Error('Should extract client_id');
    }
    if (context.client_name !== 'Test Client') {
      throw new Error('Should extract client_name');
    }
  });

  // Test 3: User context with no session (development mode)
  test('getUserContext should use defaults in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    try {
      const context = summaryOps.getUserContext({});
      if (context.user_id !== 1) {
        throw new Error('Should default to user_id 1 in development');
      }
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // Test 4: User context authentication required
  test('getUserContext should throw in production without session', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    try {
      summaryOps.getUserContext({});
      throw new Error('Should have thrown authentication error');
    } catch (error) {
      if (error.message !== 'Authentication required') {
        throw new Error('Should throw authentication required error');
      }
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // Test 5: Build turns query without client filter
  test('buildTurnsQuery should build correct query without client filter', () => {
    const { turnsQuery, queryParams } = summaryOps.buildTurnsQuery(
      '2024-01-15 00:00:00',
      '2024-01-15 23:59:59',
      null
    );
    
    if (!turnsQuery.includes('SELECT t.id, t.content')) {
      throw new Error('Should include correct SELECT columns');
    }
    if (!turnsQuery.includes('FROM meetings.turns t')) {
      throw new Error('Should include correct FROM clause');
    }
    if (turnsQuery.includes('AND t.client_id')) {
      throw new Error('Should not include client filter when client_id is null');
    }
    if (queryParams.length !== 2) {
      throw new Error('Should have 2 parameters without client filter');
    }
  });

  // Test 6: Build turns query with client filter
  test('buildTurnsQuery should build correct query with client filter', () => {
    const { turnsQuery, queryParams } = summaryOps.buildTurnsQuery(
      '2024-01-15 00:00:00',
      '2024-01-15 23:59:59',
      101
    );
    
    if (!turnsQuery.includes('AND t.client_id = $3')) {
      throw new Error('Should include client filter when client_id provided');
    }
    if (queryParams.length !== 3) {
      throw new Error('Should have 3 parameters with client filter');
    }
    if (queryParams[2] !== 101) {
      throw new Error('Should include client_id in parameters');
    }
  });

  // Test 7: Format turns for AI
  test('formatTurnsForAI should format turns correctly', () => {
    const turns = createMockTurns(2);
    const formatted = summaryOps.formatTurnsForAI(turns);
    
    if (!formatted.includes('test@example.com: This is turn 1 content')) {
      throw new Error('Should format user turn correctly');
    }
    if (!formatted.includes('Assistant: This is turn 2 content')) {
      throw new Error('Should format assistant turn correctly');
    }
  });

  // Test 8: Generate AI summary success
  await asyncTest('generateAISummary should return AI response', async () => {
    const mockAnthropic = new MockAnthropic();
    const result = await summaryOps.generateAISummary(
      mockAnthropic,
      'Test prompt',
      300
    );
    
    if (result !== 'Mock AI summary of the conversations.') {
      throw new Error('Should return AI response text');
    }
  });

  // Test 9: Generate AI summary with no client
  await asyncTest('generateAISummary should handle missing client', async () => {
    const result = await summaryOps.generateAISummary(
      null,
      'Test prompt',
      300
    );
    
    if (!result.includes('AI summary generation not available')) {
      throw new Error('Should return unavailable message when no client');
    }
  });

  // Test 10: Generate AI summary with API error
  await asyncTest('generateAISummary should handle API errors', async () => {
    const mockAnthropic = new MockAnthropic(true);
    const result = await summaryOps.generateAISummary(
      mockAnthropic,
      'Test prompt',
      300
    );
    
    if (!result.includes('Error generating summary: API Error')) {
      throw new Error('Should return error message when API fails');
    }
  });

  // Test 11: Get turns for date range
  await asyncTest('getTurnsForDateRange should execute query and return results', async () => {
    const mockTurns = createMockTurns(3);
    mockConnector.setQueryResult('turns', { rows: mockTurns });
    
    const result = await summaryOps.getTurnsForDateRange(
      '2024-01-15 00:00:00',
      '2024-01-15 23:59:59',
      101
    );
    
    if (result.length !== 3) {
      throw new Error('Should return correct number of turns');
    }
    if (result[0].id !== 'turn-1') {
      throw new Error('Should return correct turn data');
    }
  });

  // Test 12: Generate daily summary with no turns
  await asyncTest('generateDailySummary should handle no turns', async () => {
    mockConnector.setQueryResult('turns', { rows: [] });
    
    const result = await summaryOps.generateDailySummary(
      '2024-01-15',
      101,
      'Test Client',
      new MockAnthropic()
    );
    
    if (result.summary !== 'No conversations found for this date.') {
      throw new Error('Should return no conversations message');
    }
    if (result.turnCount !== 0) {
      throw new Error('Should return zero turn count');
    }
  });

  // Test 13: Generate daily summary with turns
  await asyncTest('generateDailySummary should process turns and generate summary', async () => {
    const mockTurns = createMockTurns(4);
    mockConnector.setQueryResult('turns', { rows: mockTurns });
    
    const result = await summaryOps.generateDailySummary(
      '2024-01-15',
      101,
      'Test Client',
      new MockAnthropic()
    );
    
    if (result.summary !== 'Mock AI summary of the conversations.') {
      throw new Error('Should return AI generated summary');
    }
    if (result.turnCount !== 4) {
      throw new Error('Should return correct turn count');
    }
    if (result.userTurns !== 2) {
      throw new Error('Should count user turns correctly');
    }
    if (result.assistantTurns !== 2) {
      throw new Error('Should count assistant turns correctly');
    }
  });

  // Test 14: Generate daily summary with invalid date
  await asyncTest('generateDailySummary should reject invalid date', async () => {
    try {
      await summaryOps.generateDailySummary(
        'invalid-date',
        101,
        'Test Client',
        new MockAnthropic()
      );
      throw new Error('Should have thrown date validation error');
    } catch (error) {
      if (!error.message.includes('Invalid date format')) {
        throw new Error('Should throw date format error');
      }
    }
  });

  // Test 15: Generate monthly summaries with invalid parameters
  await asyncTest('generateMonthlySummaries should validate parameters', async () => {
    try {
      await summaryOps.generateMonthlySummaries(
        2019, // Invalid year
        1,
        101,
        'Test Client',
        new MockAnthropic()
      );
      throw new Error('Should have thrown year validation error');
    } catch (error) {
      if (!error.message.includes('Invalid year')) {
        throw new Error('Should throw year validation error');
      }
    }

    try {
      await summaryOps.generateMonthlySummaries(
        2024,
        12, // Invalid month
        101,
        'Test Client',
        new MockAnthropic()
      );
      throw new Error('Should have thrown month validation error');
    } catch (error) {
      if (!error.message.includes('Invalid month')) {
        throw new Error('Should throw month validation error');
      }
    }
  });

  // Test 16: Generate yearly summaries (not implemented)
  await asyncTest('generateYearlySummaries should throw not implemented error', async () => {
    try {
      await summaryOps.generateYearlySummaries(
        2024,
        101,
        'Test Client',
        new MockAnthropic()
      );
      throw new Error('Should have thrown not implemented error');
    } catch (error) {
      if (!error.message.includes('not yet implemented')) {
        throw new Error('Should throw not implemented error');
      }
    }
  });

  // Results
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    return true;
  } else {
    console.log(`❌ ${totalTests - passedTests} tests failed`);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

export { runTests };