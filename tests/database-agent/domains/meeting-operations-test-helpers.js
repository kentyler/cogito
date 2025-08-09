/**
 * Test helper functions specific to MeetingOperations tests
 */

export function logTest(testResults, name, passed, message = '') {
  const status = passed ? '✅' : '❌';
  console.log(`  ${status} ${name}${message ? ' - ' + message : ''}`);
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

export function initializeTestResults() {
  return {
    passed: 0,
    failed: 0,
    tests: []
  };
}

export function printTestSummary(testResults) {
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! MeetingOperations is ready for use.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }
}