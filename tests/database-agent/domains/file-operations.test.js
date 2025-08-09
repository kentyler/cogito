#!/usr/bin/env node
/**
 * Main test runner for FileOperations domain
 * Runs all file operations test suites
 */

import { runFileOperationsBasicTests } from './file-operations-basic.test.js';
import { runFileOperationsChunksTests } from './file-operations-chunks.test.js';

async function runAllFileOperationsTests() {
  console.log('🧪 Running Complete FileOperations Test Suite\n');
  console.log('=' .repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  // Run basic tests
  console.log('\n📁 BASIC FILE OPERATIONS\n');
  const basicResults = await runFileOperationsBasicTests();
  totalPassed += basicResults.passed;
  totalFailed += basicResults.failed;
  
  console.log('=' .repeat(60));
  
  // Run chunk tests
  console.log('\n📦 CHUNK OPERATIONS\n');
  const chunkResults = await runFileOperationsChunksTests();
  totalPassed += chunkResults.passed;
  totalFailed += chunkResults.failed;
  
  // Final summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 COMPLETE TEST SUMMARY');
  console.log(`   ✅ Total Passed: ${totalPassed}`);
  console.log(`   ❌ Total Failed: ${totalFailed}`);
  console.log(`   📈 Overall Success Rate: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All FileOperations tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }
  
  return { passed: totalPassed, failed: totalFailed };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllFileOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runAllFileOperationsTests as runFileOperationsTests };