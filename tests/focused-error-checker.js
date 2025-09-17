#!/usr/bin/env node
/**
 * Focused Error Checker - Identifies specific code issues, not test infrastructure problems
 * 
 * Focuses on:
 * 1. Incorrect table field names (column "x" does not exist)
 * 2. Functions called with incorrect parameters
 */

import { spawn } from 'child_process';

class FocusedErrorChecker {
  constructor() {
    this.tableFieldErrors = [];
    this.parameterErrors = [];
    this.testResults = [];
  }

  async runTest(testFile, testName) {
    return new Promise((resolve) => {
      const process = spawn('node', [testFile], { stdio: 'pipe' });
      let output = '';
      let errors = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errors += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          testName,
          testFile,
          output,
          errors,
          exitCode: code
        });
      });
    });
  }

  analyzeForTableFieldErrors(testResult) {
    const combinedOutput = testResult.output + testResult.errors;
    
    // Look for SQL column errors
    const columnErrors = combinedOutput.match(/column "([^"]+)" (?:of relation "([^"]+)" )?does not exist/g);
    if (columnErrors) {
      columnErrors.forEach(error => {
        const match = error.match(/column "([^"]+)" (?:of relation "([^"]+)" )?does not exist/);
        if (match) {
          this.tableFieldErrors.push({
            test: testResult.testName,
            column: match[1],
            relation: match[2] || 'unknown',
            fullError: error,
            context: this.extractSQLContext(combinedOutput, error)
          });
        }
      });
    }

    // Look for INSERT/UPDATE with wrong column names
    const sqlErrors = combinedOutput.match(/SQL: [^\\n]*INSERT[^\\n]*/g) || 
                     combinedOutput.match(/SQL: [^\\n]*UPDATE[^\\n]*/g);
    
    if (sqlErrors && columnErrors) {
      sqlErrors.forEach(sql => {
        this.tableFieldErrors[this.tableFieldErrors.length - 1].sql = sql;
      });
    }
  }

  analyzeForParameterErrors(testResult) {
    const combinedOutput = testResult.output + testResult.errors;
    
    // Look for parameter count mismatches
    const paramErrors = [
      /Expected \d+ arguments, but got \d+/g,
      /TypeError: .* is not a function/g,
      /TypeError: Cannot read propert.*of undefined/g,
      /Error: .* requires .* parameter/g,
      /ArgumentError: .* expects .* arguments/g
    ];

    paramErrors.forEach(pattern => {
      const matches = combinedOutput.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.parameterErrors.push({
            test: testResult.testName,
            error: match,
            context: this.extractErrorContext(combinedOutput, match)
          });
        });
      }
    });
  }

  extractSQLContext(output, error) {
    const lines = output.split('\n');
    const errorLine = lines.findIndex(line => line.includes(error));
    if (errorLine === -1) return '';
    
    // Get 3 lines before and after the error
    const start = Math.max(0, errorLine - 3);
    const end = Math.min(lines.length, errorLine + 4);
    return lines.slice(start, end).join('\n');
  }

  extractErrorContext(output, error) {
    const lines = output.split('\n');
    const errorLine = lines.findIndex(line => line.includes(error));
    if (errorLine === -1) return '';
    
    // Get 2 lines before and after the error
    const start = Math.max(0, errorLine - 2);
    const end = Math.min(lines.length, errorLine + 3);
    return lines.slice(start, end).join('\n');
  }

  async runFocusedTests() {
    console.log('🔍 Running Focused Error Detection Tests');
    console.log('========================================');
    console.log('Looking for:');
    console.log('  1. ❌ Incorrect table field names');
    console.log('  2. ❌ Function parameter mismatches');
    console.log('========================================\n');

    const testFiles = [
      { file: 'tests/database-agent/run-all-tests.js', name: 'Database Agent Tests' },
      { file: 'tests/run-auth-tests.js', name: 'Auth Tests' },
      // Add more test files as needed
    ];

    for (const testConfig of testFiles) {
      console.log(`🧪 Running ${testConfig.name}...`);
      const result = await this.runTest(testConfig.file, testConfig.name);
      
      this.analyzeForTableFieldErrors(result);
      this.analyzeForParameterErrors(result);
      
      console.log(`   Exit code: ${result.exitCode}`);
    }
  }

  generateReport() {
    console.log('\n📊 FOCUSED ERROR ANALYSIS REPORT');
    console.log('=====================================\n');

    if (this.tableFieldErrors.length > 0) {
      console.log('🔴 TABLE FIELD NAME ERRORS:');
      console.log('----------------------------');
      this.tableFieldErrors.forEach((error, i) => {
        console.log(`${i + 1}. Column "${error.column}" does not exist in relation "${error.relation}"`);
        console.log(`   Test: ${error.test}`);
        if (error.sql) {
          console.log(`   SQL: ${error.sql.replace('SQL: ', '').substring(0, 80)}...`);
        }
        console.log('   Context:');
        console.log(`   ${error.context.split('\n').map(l => `     ${l}`).join('\n')}`);
        console.log('');
      });
    } else {
      console.log('✅ NO TABLE FIELD NAME ERRORS FOUND\n');
    }

    if (this.parameterErrors.length > 0) {
      console.log('🔴 FUNCTION PARAMETER ERRORS:');
      console.log('-----------------------------');
      this.parameterErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.error}`);
        console.log(`   Test: ${error.test}`);
        console.log('   Context:');
        console.log(`   ${error.context.split('\n').map(l => `     ${l}`).join('\n')}`);
        console.log('');
      });
    } else {
      console.log('✅ NO FUNCTION PARAMETER ERRORS FOUND\n');
    }

    console.log('📋 SUMMARY:');
    console.log(`   Table Field Errors: ${this.tableFieldErrors.length}`);
    console.log(`   Parameter Errors: ${this.parameterErrors.length}`);
    console.log(`   Total Code Issues: ${this.tableFieldErrors.length + this.parameterErrors.length}`);
    
    if (this.tableFieldErrors.length === 0 && this.parameterErrors.length === 0) {
      console.log('\n🎉 NO CRITICAL CODE ERRORS FOUND - READY FOR MERGE!');
      return true;
    } else {
      console.log('\n⚠️  CRITICAL CODE ERRORS FOUND - MUST FIX BEFORE MERGE');
      return false;
    }
  }
}

async function main() {
  const checker = new FocusedErrorChecker();
  await checker.runFocusedTests();
  const isReady = checker.generateReport();
  process.exit(isReady ? 0 : 1);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export { FocusedErrorChecker };