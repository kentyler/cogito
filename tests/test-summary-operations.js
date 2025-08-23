/**
 * Legacy test suite for SummaryOperations - moved core tests to test-summary-operations-core.js
 * This file contains extended/edge case tests
 */

import { SummaryOperations } from '../lib/database-agent/domains/summary-operations.js';
// import { DatabaseConnector } from '../lib/database-agent/core/database-connector.js';

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
      create: async (_options) => {
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
}
