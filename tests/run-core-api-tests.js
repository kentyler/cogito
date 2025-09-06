#!/usr/bin/env node
/**
 * Run Core API Route Tests
 * Essential API test coverage for pre-merge validation
 */

import { conversationsApiTestSuite } from './api-routes/test-conversations-api.js';
import { meetingsApiTestSuite } from './api-routes/test-meetings-api.js';
import { settingsApiCoreTestSuite } from './api-routes/test-settings-api-core.js';
import { botCreateApiCoreTestSuite } from './api-routes/test-bots-create-api-core.js';

async function runCoreApiTests() {
  console.log('\n🚀 Running Core API Route Test Suites');
  console.log('='.repeat(70));
  console.log('📝 Core test coverage for stable API routes');
  
  const suites = [
    { name: 'Conversations API', suite: conversationsApiTestSuite },
    { name: 'Meetings API', suite: meetingsApiTestSuite },  
    { name: 'Settings API Core', suite: settingsApiCoreTestSuite },
    { name: 'Bot Creation API Core', suite: botCreateApiCoreTestSuite }
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
  
  console.log('\n📊 Final Core API Route Test Results');
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
    console.log(`\n🎉 All Core API Route Tests Passed! Ready for merge.`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Some tests failed. Review issues before merging.`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCoreApiTests().catch(error => {
    console.error('💥 Core test runner failed:', error);
    process.exit(1);
  });
}