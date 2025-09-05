#!/usr/bin/env node
/**
 * File size checker - Use this during development to prevent violations
 * Usage: node scripts/check-file-size.js [filename]
 */

import fs from 'fs';
import path from 'path';

const MAX_LINES = 200;
const MAX_TEST_LINES = 300;
const WARN_THRESHOLD = 150;

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  const isTestFile = filePath.includes('/test') || filePath.endsWith('.test.js') || filePath.endsWith('.spec.js');
  const limit = isTestFile ? MAX_TEST_LINES : MAX_LINES;
  
  const fileName = path.basename(filePath);
  
  if (lines > limit) {
    console.log(`❌ ${fileName}: ${lines} lines (limit: ${limit})`);
    console.log(`   🛠️  IMMEDIATE ACTION REQUIRED: Break this file down!`);
    return false;
  } else if (lines > WARN_THRESHOLD) {
    console.log(`⚠️  ${fileName}: ${lines} lines (approaching limit: ${limit})`);
    console.log(`   💡 Consider splitting soon to avoid violations`);
    return true;
  } else {
    console.log(`✅ ${fileName}: ${lines} lines (within limit: ${limit})`);
    return true;
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/check-file-size.js <filename>');
    console.log('Examples:');
    console.log('  node scripts/check-file-size.js server/routes/auth.js');
    console.log('  node scripts/check-file-size.js database/database-agent.js');
    process.exit(1);
  }
  
  let allGood = true;
  
  for (const filePath of args) {
    const result = checkFileSize(filePath);
    if (!result) allGood = false;
  }
  
  if (allGood) {
    console.log('\n🎉 All files are within size limits!');
  } else {
    console.log('\n💥 Some files exceed limits - please refactor before committing!');
    process.exit(1);
  }
}

main();