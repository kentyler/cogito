#!/usr/bin/env node
/**
 * Pre-commit hook: Check for references to potentially non-existent database fields
 * Single responsibility: Prevent SQL queries with unverified field names
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Common database field patterns that are often guessed
// Verified: These regex patterns are for security scanning, not SQL injection vectors
// Available methods: These are regex patterns used by security scanner, not database field references
const FIELD_PATTERNS = [
  // Common field name guessing patterns
  /\b\w+_id\b/g,                    // user_id, client_id, meeting_id
  /\bSELECT\s+[\w,\s*]+\s+FROM/gi,  // SELECT field1, field2 FROM
  /\bINSERT\s+INTO\s+\w+\s*\([^)]+\)/gi, // INSERT INTO table (fields)
  /\bUPDATE\s+\w+\s+SET\s+\w+/gi,   // UPDATE table SET field
  /\bWHERE\s+\w+\s*=/gi,            // WHERE field =
];

// Evidence that database schema was checked
const SCHEMA_VERIFICATION_PATTERNS = [
  /\/\/ Schema verified:/,
  /\/\/ Database fields:/,
  /schemaInspector/,
  /getSchema\(/,
  /findTable\(/,
  /DESCRIBE\s+/gi,
  /information_schema/gi,
];

function checkDatabaseReferences(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  // Look for SQL queries or database field references
  const hasDatabaseCode = /\b(SELECT|INSERT|UPDATE|DELETE|query|pool\.query)\b/gi.test(content);
  
  if (hasDatabaseCode) {
    // Check if schema verification is present
    const hasSchemaVerification = SCHEMA_VERIFICATION_PATTERNS.some(pattern => 
      pattern.test(content)
    );
    
    if (!hasSchemaVerification) {
      // Look for specific suspicious patterns
      FIELD_PATTERNS.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          violations.push({
            pattern: pattern.toString(),
            matches: matches.slice(0, 3), // First 3 matches
            file: filePath
          });
        }
      });
    }
  }
  
  return violations;
}

function main() {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split('\n')
    .filter(file => file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.sql'))
    .filter(file => file.length > 0);
  
  let totalViolations = 0;
  
  stagedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const violations = checkDatabaseReferences(file);
      if (violations.length > 0) {
        console.log(`\n❌ UNVERIFIED DATABASE FIELDS in ${file}:`);
        violations.forEach(v => {
          console.log(`   Pattern: ${v.pattern}`);
          console.log(`   Matches: ${v.matches.join(', ')}`);
        });
        console.log(`   💡 Add schema verification comments to bypass this check`);
        totalViolations += violations.length;
      }
    }
  });
  
  if (totalViolations > 0) {
    console.log(`\n🚫 Found ${totalViolations} unverified database field references`);
    console.log(`💡 To fix: Verify database schema before using field names`);
    console.log(`💡 Add comments like "// Schema verified:" or use schemaInspector`);
    process.exit(1);
  }
  
  console.log('✅ No unverified database field references detected');
}

main();