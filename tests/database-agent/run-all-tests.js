#!/usr/bin/env node
/**
 * Master Test Runner for DatabaseAgent Domain Tests
 * Runs all domain test suites and provides consolidated reporting
 */

import { runUserOperationsTests } from './domains/user-operations.test.js';
import { runMeetingOperationsTests } from './domains/meeting-operations.test.js';
import { runFileOperationsTests } from './domains/file-operations.test.js';
import { runTurnOperationsTests } from './domains/turn-operations.test.js';
import { runClientOperationsTests } from './domains/client-operations.test.js';
import { runLLMOperationsTests } from './domains/llm-operations.test.js';
import { runIntegrationTests } from './integration/converted-files.test.js';
// TODO: Import other domain tests as they're created
// import { runLocationOperationsTests } from './domains/location-operations.test.js';

const DOMAINS = [
  {
    name: 'User Operations',
    testFunction: runUserOperationsTests,
    status: 'implemented'
  },
  {
    name: 'Meeting Operations', 
    testFunction: runMeetingOperationsTests,
    status: 'implemented'
  },
  {
    name: 'File Operations',
    testFunction: runFileOperationsTests,
    status: 'implemented'
  },
  {
    name: 'Turn Operations',
    testFunction: runTurnOperationsTests, 
    status: 'implemented'
  },
  {
    name: 'Client Operations',
    testFunction: runClientOperationsTests,
    status: 'implemented'
  },
  {
    name: 'LLM Operations',
    testFunction: runLLMOperationsTests,
    status: 'implemented'
  },
  {
    name: 'Integration Tests',
    testFunction: runIntegrationTests,
    status: 'implemented'
  },
  // {
  //   name: 'Location Operations',
  //   testFunction: runLocationOperationsTests,
  //   status: 'pending'
  // }
];

async function runAllDatabaseAgentTests() {
  console.log('🧪 DatabaseAgent Domain Test Suite Runner\n');
  console.log('=' .repeat(60));
  
  const overallResults = {
    totalPassed: 0,
    totalFailed: 0,
    domainResults: [],
    startTime: Date.now()
  };

  let implementedDomains = 0;
  let pendingDomains = 0;

  for (const domain of DOMAINS) {
    if (domain.status === 'pending') {
      console.log(`⏳ ${domain.name}: Not yet implemented`);
      pendingDomains++;
      continue;
    }

    console.log(`\n🚀 Running ${domain.name} Tests...`);
    console.log('-'.repeat(40));
    
    try {
      const results = await domain.testFunction();
      
      overallResults.totalPassed += results.passed;
      overallResults.totalFailed += results.failed;
      overallResults.domainResults.push({
        name: domain.name,
        passed: results.passed,
        failed: results.failed,
        success: results.failed === 0
      });
      
      implementedDomains++;
      
      const status = results.failed === 0 ? '✅' : '❌';
      const rate = Math.round((results.passed / (results.passed + results.failed)) * 100);
      console.log(`${status} ${domain.name}: ${results.passed}/${results.passed + results.failed} (${rate}%)`);
      
    } catch (error) {
      console.error(`Error: ${error.message}`);
      overallResults.domainResults.push({
        name: domain.name,
        passed: 0,
        failed: 1,
        success: false,
        error: error.message
      });
      overallResults.totalFailed += 1;
      implementedDomains++;
    }
  }

  // Final Summary
  const totalTime = Date.now() - overallResults.startTime;
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n🔢 Overall Statistics:`);
  console.log(`   ✅ Tests Passed: ${overallResults.totalPassed}`);
  console.log(`   ❌ Tests Failed: ${overallResults.totalFailed}`);
  console.log(`   ⏱️  Total Time: ${totalTime}ms`);
  
  if (overallResults.totalPassed + overallResults.totalFailed > 0) {
    const overallRate = Math.round((overallResults.totalPassed / (overallResults.totalPassed + overallResults.totalFailed)) * 100);
    console.log(`   📈 Success Rate: ${overallRate}%`);
  }

  console.log(`\n📁 Domain Progress:`);
  console.log(`   ✅ Implemented: ${implementedDomains}`);
  console.log(`   ⏳ Pending: ${pendingDomains}`);
  console.log(`   📊 Total Domains: ${DOMAINS.length}`);

  if (overallResults.domainResults.length > 0) {
    console.log(`\n🏆 Domain Results:`);
    overallResults.domainResults.forEach(domain => {
      const status = domain.success ? '✅' : '❌';
      const rate = domain.passed + domain.failed > 0 ? 
        Math.round((domain.passed / (domain.passed + domain.failed)) * 100) : 0;
      console.log(`   ${status} ${domain.name}: ${domain.passed}/${domain.passed + domain.failed} (${rate}%)`);
      if (domain.error) {
        console.log(`     ⚠️  Error: ${domain.error}`);
      }
    });
  }

  // Exit codes
  const hasFailures = overallResults.totalFailed > 0;
  const hasErrors = overallResults.domainResults.some(d => d.error);
  
  if (!hasFailures && !hasErrors) {
    console.log('\n🎉 All implemented domains passing! Ready for production.');
  } else if (hasErrors) {
    console.log('\n💥 Some test suites had errors. Check the logs above.');
  } else {
    console.log('\n⚠️  Some tests are failing. Review and fix before deployment.');
  }

  if (pendingDomains > 0) {
    console.log(`\n🚧 ${pendingDomains} domains still need implementation.`);
  }

  return {
    success: !hasFailures && !hasErrors,
    results: overallResults
  };
}

// Instructions for adding new domains
function printInstructions() {
  console.log('\n📖 Adding New Domain Tests:');
  console.log('1. Create domain test file: tests/database-agent/domains/your-domain.test.js');
  console.log('2. Export test function: export { runYourDomainTests }');
  console.log('3. Import and add to DOMAINS array in this file');
  console.log('4. Update status from "pending" to "implemented"');
  console.log('5. Run: node tests/database-agent/run-all-tests.js');
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDatabaseAgentTests()
    .then(result => {
      if (process.argv.includes('--help')) {
        printInstructions();
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner crashed:', error);
      process.exit(1);
    });
}

export { runAllDatabaseAgentTests };