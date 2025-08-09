#!/usr/bin/env node
/**
 * MeetingOperations Test Suite - Main Runner
 * Combines basic and advanced test modules for comprehensive testing
 */

import { runBasicMeetingOperationsTests } from './meeting-operations-basic.test.js';
import { runAdvancedMeetingOperationsTests } from './meeting-operations-advanced.test.js';
import { printTestSummary } from './meeting-operations-test-helpers.js';

export async function runMeetingOperationsTests() {
  console.log('🧪 Running Complete MeetingOperations Test Suite\n');
  console.log('=' .repeat(60));

  let combinedResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Run basic tests
    console.log('\n🚀 Phase 1: Basic Operations');
    console.log('-'.repeat(40));
    const basicResults = await runBasicMeetingOperationsTests();
    
    combinedResults.passed += basicResults.passed;
    combinedResults.failed += basicResults.failed;
    combinedResults.tests.push(...basicResults.tests);

    // Run advanced tests
    console.log('\n🚀 Phase 2: Advanced Operations');
    console.log('-'.repeat(40));
    const advancedResults = await runAdvancedMeetingOperationsTests();
    
    combinedResults.passed += advancedResults.passed;
    combinedResults.failed += advancedResults.failed;
    combinedResults.tests.push(...advancedResults.tests);

    // Combined Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMBINED TEST RESULTS');
    console.log('='.repeat(60));
    
    printTestSummary(combinedResults);

    // Phase breakdown
    console.log(`\n📊 Phase Breakdown:`);
    console.log(`   🔰 Basic: ${basicResults.passed}/${basicResults.passed + basicResults.failed} passed`);
    console.log(`   🚀 Advanced: ${advancedResults.passed}/${advancedResults.passed + advancedResults.failed} passed`);

  } catch (error) {
    console.error('❌ Combined test suite error:', error);
    combinedResults.failed += 1;
  }

  return combinedResults;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMeetingOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}