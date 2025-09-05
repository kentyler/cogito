#!/usr/bin/env node
/**
 * Pre-write file size checker
 * This can be called by AI tools before writing large files
 * Usage: node scripts/pre-write-check.js <filename> <content>
 */

const MAX_LINES = 200;
const MAX_TEST_LINES = 300;

function checkContentSize(filename, content) {
  const lines = content.split('\n').length;
  const isTestFile = filename.includes('/test') || filename.endsWith('.test.js') || filename.endsWith('.spec.js');
  const limit = isTestFile ? MAX_TEST_LINES : MAX_LINES;
  
  if (lines > limit) {
    console.log(`🚫 PREVENTED: ${filename} would be ${lines} lines (limit: ${limit})`);
    console.log(`❌ File creation blocked to prevent size violation`);
    console.log(`💡 Break this into smaller modules before creating:`);
    console.log(`   - Extract utility functions to lib/ folder`);
    console.log(`   - Split into multiple focused files`);
    console.log(`   - Use existing helper modules`);
    return false;
  }
  
  if (lines > 150) {
    console.log(`⚠️  WARNING: ${filename} will be ${lines} lines (approaching limit: ${limit})`);
    console.log(`💡 Consider splitting this file to prevent future issues`);
  }
  
  return true;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('Usage: node scripts/pre-write-check.js <filename> <content>');
    process.exit(1);
  }
  
  const [filename, content] = args;
  const allowed = checkContentSize(filename, content);
  
  process.exit(allowed ? 0 : 1);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { checkContentSize };