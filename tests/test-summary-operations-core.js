/**
 * Core tests for SummaryOperations database agent module
 * Split from test-summary-operations.js to maintain file size limits
 */

import { SummaryOperations } from '../lib/database-agent/domains/summary-operations.js';

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
 * Main test runner for core SummaryOperations functionality
 */
export async function runSummaryOperationsTests() {
  console.log('🧪 Testing SummaryOperations Core Functionality...');
  
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
    const validDate = summaryOps.validateDate('2024-01-15');
    if (!validDate || validDate.getFullYear() !== 2024) {
      throw new Error('Should parse valid date');
    }
  });
  
  // Test 2: Invalid date validation
  test('validateDate should reject invalid dates', () => {
    const invalidDate = summaryOps.validateDate('not-a-date');
    if (invalidDate !== null) {
      throw new Error('Should return null for invalid date');
    }
  });
  
  // Test 3: User context
  test('getUserContext should return session info in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const context = summaryOps.getUserContext({ user: { id: 123 } });
    if (context.userId !== 123) {
      throw new Error('Should extract user ID from session');
    }
    
    process.env.NODE_ENV = originalEnv;
  });
  
  // Test 4: Summary generation with valid data
  await asyncTest('generateDailySummary should create summary', async () => {
    // Mock some turn data
    mockConnector.setQueryResult('turns', {
      rows: [
        {
          id: '1',
          content: 'Test conversation content',
          source_type: 'user',
          created_at: new Date()
        }
      ]
    });
    
    const summary = await summaryOps.generateDailySummary(
      '2024-01-15',
      101,
      'Test Client',
      new MockAnthropic()
    );
    
    if (!summary || !summary.content) {
      throw new Error('Should return summary with content');
    }
  });
  
  // Test 5: Error handling
  await asyncTest('generateDailySummary should handle API errors', async () => {
    mockConnector.setQueryResult('turns', {
      rows: [{ id: '1', content: 'Test', source_type: 'user', created_at: new Date() }]
    });
    
    try {
      await summaryOps.generateDailySummary(
        '2024-01-15',
        101,
        'Test Client',
        new MockAnthropic(true) // Should fail
      );
      throw new Error('Should have thrown API error');
    } catch (error) {
      if (!error.message.includes('API Error')) {
        throw new Error('Should throw API error');
      }
    }
  });

  // Results
  console.log(`\n📊 Core Tests Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All core SummaryOperations tests passed!');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} tests failed`);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSummaryOperationsTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}