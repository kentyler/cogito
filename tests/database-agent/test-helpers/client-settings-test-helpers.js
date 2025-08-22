/**
 * Client Settings Test Helpers
 * Common test utilities for client settings operations
 */

export function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertNull(actual, message) {
  if (actual !== null) {
    throw new Error(`${message || 'Expected null'}: got ${JSON.stringify(actual)}`);
  }
}

export function assertTrue(actual, message) {
  if (!actual) {
    throw new Error(`${message || 'Expected true'}: got ${actual}`);
  }
}

export function assertFalse(actual, message) {
  if (actual) {
    throw new Error(`${message || 'Expected false'}: got ${actual}`);
  }
}

export function createTestRunner() {
  const testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}${message ? ' - ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
  }

  async function runTest(name, testFn) {
    try {
      await testFn();
      logTest(name, true);
    } catch (error) {
      logTest(name, false, error.message);
    }
  }

  return { testResults, runTest };
}