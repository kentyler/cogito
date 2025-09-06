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
    let output = '';
    let errors = '';
    
    const child = spawn('node', [testPath], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log(chunk);
      output += chunk;
    });
    
    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.error(chunk);
      errors += chunk;
    });
    
    child.on('close', (code) => {
      const result = {
        testName: description,
        testFile,
        output,
        errors,
        exitCode: code,
        success: code === 0
      };
      
      if (code === 0) {
        console.log(`\n✅ ${description} completed successfully\n`);
        resolve(result);
      } else {
        console.log(`\n❌ ${description} failed with code ${code}\n`);
        
        // Analyze for critical errors
        const combinedOutput = output + errors;
        const isTableFieldError = combinedOutput.includes('column') && combinedOutput.includes('does not exist');
        const isParameterError = combinedOutput.includes('arguments') || 
                                combinedOutput.includes('parameter') || 
                                combinedOutput.includes('is not a function');
        
        if (isTableFieldError) {
          console.error(`🔴 CRITICAL TABLE FIELD ERROR detected in ${description}`);
          result.errorType = 'TABLE_FIELD';
        } else if (isParameterError) {
          console.error(`🔴 CRITICAL PARAMETER ERROR detected in ${description}`);
          result.errorType = 'PARAMETER';
        } else {
          result.errorType = 'OTHER';
        }
        
        reject(result);
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n💥 ${description} error:`, error.message, '\n');
      reject({
        testName: description,
        testFile,
        output: '',
        errors: error.message,
        exitCode: 1,
        success: false,
        error: error.message,
        errorType: 'OTHER'
      });
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
  const failedTests = [];
  
  for (const [testFile, description] of tests) {
    try {
      await runTest(testFile, description);
      passed++;
    } catch (testResult) {
      failed++;
      failedTests.push(testResult);
      console.error(`Failed: ${description}`);
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Test Suite Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total:  ${passed + failed}`);
  
  // Critical Error Analysis
  const tableFieldErrors = failedTests.filter(t => t.errorType === 'TABLE_FIELD');
  const parameterErrors = failedTests.filter(t => t.errorType === 'PARAMETER');
  const criticalErrors = tableFieldErrors.length + parameterErrors.length;
  
  if (criticalErrors > 0) {
    console.log('\n🚨 CRITICAL CODE ERRORS FOUND:');
    console.log('================================');
    
    if (tableFieldErrors.length > 0) {
      console.log(`\n🔴 TABLE FIELD ERRORS (${tableFieldErrors.length}):`);
      tableFieldErrors.forEach(error => {
        console.log(`   ❌ ${error.testName}: Column does not exist`);
        if (error.errors) {
          const errorMsg = error.errors.substring(0, 80);
          console.log(`      Error: ${errorMsg}${error.errors.length > 80 ? '...' : ''}`);
        }
      });
    }
    
    if (parameterErrors.length > 0) {
      console.log(`\n🔴 PARAMETER ERRORS (${parameterErrors.length}):`);
      parameterErrors.forEach(error => {
        console.log(`   ❌ ${error.testName}: Function call mismatch`);
        if (error.errors) {
          const errorMsg = error.errors.substring(0, 80);
          console.log(`      Error: ${errorMsg}${error.errors.length > 80 ? '...' : ''}`);
        }
      });
    }
    
    console.log(`\n⚠️  MUST FIX ${criticalErrors} CRITICAL ERRORS BEFORE MERGE!`);
  }
  
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