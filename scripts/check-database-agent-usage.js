#!/usr/bin/env node
/**
 * Pre-commit hook to enforce DatabaseAgent usage
 * Rejects any raw SQL queries outside of the database agent
 */

import fs from 'fs';
import path from 'path';

const ALLOWED_SQL_DIRECTORIES = [
  'database/database-agent',
  'migrations',
  'scripts'  // Allow scripts to have raw SQL for migrations/admin tasks
];

const SQL_PATTERNS = [
  /SELECT\s+\w+.*FROM\s+/i,  // More specific - must have FROM
  /INSERT\s+INTO\s+\w+/i,
  /UPDATE\s+\w+\s+SET\s+/i,
  /DELETE\s+FROM\s+\w+/i,
  /CREATE\s+TABLE\s+\w+/i,
  /ALTER\s+TABLE\s+\w+/i,
  /DROP\s+TABLE\s+\w+/i,
  /await.*\.query\s*\(/i,  // Database query calls
  /pool\.query\s*\(/i       // Direct pool usage
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  // Skip if file is in allowed directories
  const isAllowed = ALLOWED_SQL_DIRECTORIES.some(allowedDir => 
    filePath.includes(allowedDir)
  );
  
  if (isAllowed) {
    return violations;
  }

  // Check for SQL patterns
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Skip comments and strings that might contain SQL examples
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }

    SQL_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          message: 'Raw SQL detected outside DatabaseAgent - use DatabaseAgent methods instead'
        });
      }
    });
  });

  return violations;
}

function main() {
  const args = process.argv.slice(2);
  const filesToCheck = args.length > 0 ? args : [];

  // If no files specified, check common code directories
  if (filesToCheck.length === 0) {
    const directories = ['server/routes', 'server/lib', 'public/js'];
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir, { recursive: true })
          .filter(file => file.endsWith('.js'))
          .map(file => path.join(dir, file));
        filesToCheck.push(...files);
      }
    });
  }

  let totalViolations = 0;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file) && file.endsWith('.js')) {
      const violations = checkFile(file);
      if (violations.length > 0) {
        console.error(`\n❌ Raw SQL violations in ${file}:`);
        violations.forEach(violation => {
          console.error(`  Line ${violation.line}: ${violation.content}`);
          console.error(`  → ${violation.message}`);
        });
        totalViolations += violations.length;
      }
    }
  });

  if (totalViolations > 0) {
    console.error(`\n🚫 Found ${totalViolations} raw SQL violation(s)`);
    console.error('📋 Use DatabaseAgent methods instead:');
    console.error('   - dbAgent.users.getUserClients(userId)');
    console.error('   - dbAgent.users.updateUserPreference(userId, field, value)');
    console.error('   - dbAgent.clients.getClientById(clientId)');
    console.error('   - etc.');
    process.exit(1);
  }

  console.log('✅ No raw SQL violations found');
}

main();