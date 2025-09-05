#!/usr/bin/env node
/**
 * Authentication Test Runner
 * Executes both simple and integration tests
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Authentication Test Suite Runner\n');

async function runTest(testFile, description) {
  console.log(`📋 Running ${description}...`);
  console.log(`   File: ${testFile}\n`);
  
  return new Promise((resolve, reject) => {
    const testPath = join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${description} completed successfully\n`);
        resolve();
      } else {
        console.log(`\n❌ ${description} failed with code ${code}\n`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n💥 ${description} error:`, error.message, '\n');
      reject(error);
    });
  });
}

async function main() {
  const tests = [
    ['test-auth-functions-simple.js', 'Simple Auth Function Tests'],
    ['test-auth-integration.js', 'Integration Tests with Database']
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [testFile, description] of tests) {
    try {
      await runTest(testFile, description);
      passed++;
    } catch (error) {
      failed++;
      console.error(`Failed: ${description}`);
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Test Suite Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total:  ${passed + failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Check output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All test suites passed!');
  }
}

main().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});