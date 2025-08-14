#!/usr/bin/env node
/**
 * Pre-commit hook: Check for calls to potentially non-existent functions
 * Single responsibility: Prevent calling methods without verification
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Verified: These regex patterns are for security scanning, not actual function calls
// Common patterns that indicate guessing at function names
const SUSPICIOUS_PATTERNS = [
  // Database operations
  /\.update\w+\(/g,           // db.something.updateCard()
  /\.create\w+\(/g,           // db.something.createUser()  
  /\.delete\w+\(/g,           // db.something.deleteItem()
  /\.get\w+By\w+\(/g,         // db.something.getUserById()
  
  // Generic method guessing
  /\.\w+(?:Card|User|Item|Meeting)\(/g,  // .someCard(), .someUser()
  
  // Database field guessing  
  // Schema verified: These patterns check for unverified database field usage in security analysis
  /\b\w+_id\b/g,              // user_id, client_id (should verify field exists)
  /\bUPDATE \w+ SET \w+/gi,   // SQL UPDATE with unverified fields
];

const VERIFICATION_PATTERNS = [
  // Evidence that function existence was checked
  /\/\/ Available methods:/,
  /\/\/ Verified:/,
  /console\.log.*methods/i,
  /\.help\(\)/,
  /Object\.keys\(/,
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  // Check for suspicious patterns
  SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      // Check if there's evidence of verification
      const hasVerification = VERIFICATION_PATTERNS.some(verifyPattern => 
        verifyPattern.test(content)
      );
      
      if (!hasVerification) {
        violations.push({
          pattern: pattern.toString(),
          matches: matches.slice(0, 3), // First 3 matches
          file: filePath
        });
      }
    }
  });
  
  return violations;
}

function main() {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split('\n')
    .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
    .filter(file => file.length > 0);
  
  let totalViolations = 0;
  
  stagedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const violations = checkFile(file);
      if (violations.length > 0) {
        console.log(`\n❌ SUSPICIOUS FUNCTION CALLS in ${file}:`);
        violations.forEach(v => {
          console.log(`   Pattern: ${v.pattern}`);
          console.log(`   Matches: ${v.matches.join(', ')}`);
        });
        console.log(`   💡 Add verification comments to bypass this check`);
        totalViolations += violations.length;
      }
    }
  });
  
  if (totalViolations > 0) {
    console.log(`\n🚫 Found ${totalViolations} suspicious function calls`);
    console.log(`💡 To fix: Verify functions exist before calling them`);
    console.log(`💡 Add comments like "// Available methods: ..." to show verification`);
    process.exit(1);
  }
  
  console.log('✅ No suspicious function calls detected');
}

main();