#!/usr/bin/env node
/**
 * Run Split API Route Tests
 * Comprehensive test runner using modular test files
 */

import { conversationsApiTestSuite } from './api-routes/test-conversations-api.js';
import { meetingsApiTestSuite } from './api-routes/test-meetings-api.js';
import { settingsCoreTestSuite } from './api-routes/test-settings-core.js';
import { settingsExtendedTestSuite } from './api-routes/test-settings-extended.js';
import { botCreateCoreTestSuite } from './api-routes/test-bots-create-core.js';
import { botCreateExtendedTestSuite } from './api-routes/test-bots-create-extended.js';

async function runSplitApiTests() {
  console.log('\n🚀 Running Split API Route Test Suites');
  console.log('='.repeat(70));
  console.log('📝 Modular test coverage with focused test files');
  
  const suites = [
    { name: 'Conversations API', suite: conversationsApiTestSuite },
    { name: 'Meetings API', suite: meetingsApiTestSuite },  
    { name: 'Settings API - Core', suite: settingsCoreTestSuite },
    { name: 'Settings API - Extended', suite: settingsExtendedTestSuite },
    { name: 'Bot Creation API - Core', suite: botCreateCoreTestSuite },
    { name: 'Bot Creation API - Extended', suite: botCreateExtendedTestSuite }
  ];
  
  const allResults = {
    passed: 0,
    failed: 0,
    total: 0,
    suites: []
  };
  
  for (const { name, suite } of suites) {
    console.log(`\n📋 Running ${name} Tests...`);
    
    try {
      const results = await suite.run();
      
      allResults.passed += results.passed;
      allResults.failed += results.failed;
      allResults.total += results.tests.length;
      allResults.suites.push({
        name,
        passed: results.passed,
        failed: results.failed,
        total: results.tests.length
      });
      
      if (results.failed > 0) {
        console.log(`❌ ${name}: ${results.failed} failed out of ${results.tests.length}`);
      } else {
        console.log(`✅ ${name}: All ${results.passed} tests passed!`);
      }
      
    } catch (error) {
      console.error(`💥 ${name} test suite failed to run:`, error.message);
      allResults.failed += 1;
      allResults.total += 1;
      allResults.suites.push({
        name,
        passed: 0,
        failed: 1,
        total: 1,
        error: error.message
      });
    }
  }
  
  console.log('\n📊 Final Split API Route Test Results');
  console.log('='.repeat(70));
  
  for (const suite of allResults.suites) {
    const status = suite.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${suite.name}: ${suite.passed}/${suite.total} passed`);
    if (suite.error) {
      console.log(`   💥 Suite Error: ${suite.error}`);
    }
  }
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`   ✅ Total Passed: ${allResults.passed}`);
  console.log(`   ❌ Total Failed: ${allResults.failed}`);
  console.log(`   📈 Total Tests: ${allResults.total}`);
  console.log(`   📊 Success Rate: ${Math.round((allResults.passed / allResults.total) * 100)}%`);
  
  if (allResults.failed === 0) {
    console.log(`\n🎉 All Split API Route Tests Passed! Ready for merge.`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Some tests failed. Review issues before merging.`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSplitApiTests().catch(error => {
    console.error('💥 Split test runner failed:', error);
    process.exit(1);
  });
}