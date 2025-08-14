#!/usr/bin/env node
/**
 * Install verification hooks into git pre-commit
 * Single responsibility: Set up the verification toolchain
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const HOOKS_DIR = '.git/hooks';
const PRE_COMMIT_FILE = path.join(HOOKS_DIR, 'pre-commit');

const PRE_COMMIT_CONTENT = `#!/bin/bash
# Git pre-commit hook with verification and security checks

echo "🔍 Running verification and security checks..."

# File size check (existing)
node scripts/hooks/check-file-sizes.js
if [ $? -ne 0 ]; then
    echo "❌ File size check failed"
    exit 1
fi

# Function existence check  
node scripts/hooks/check-function-existence.js
if [ $? -ne 0 ]; then
    echo "❌ Function existence check failed"
    exit 1
fi

# Database field verification check
node scripts/hooks/check-database-fields.js  
if [ $? -ne 0 ]; then
    echo "❌ Database field check failed"
    exit 1
fi

# Security vulnerability check
node scripts/hooks/check-security-vulnerabilities.js
if [ $? -ne 0 ]; then
    echo "❌ Security vulnerability check failed"
    exit 1
fi

echo "✅ All verification and security checks passed"
exit 0
`;

function installHooks() {
  // Ensure hooks directory exists
  if (!fs.existsSync(HOOKS_DIR)) {
    console.log('❌ .git/hooks directory not found. Are you in a git repository?');
    process.exit(1);
  }
  
  // Backup existing pre-commit hook if it exists
  if (fs.existsSync(PRE_COMMIT_FILE)) {
    const backup = `${PRE_COMMIT_FILE}.backup-${Date.now()}`;
    fs.copyFileSync(PRE_COMMIT_FILE, backup);
    console.log(`📦 Backed up existing pre-commit hook to ${backup}`);
  }
  
  // Write new pre-commit hook
  fs.writeFileSync(PRE_COMMIT_FILE, PRE_COMMIT_CONTENT);
  
  // Make it executable
  execSync(`chmod +x ${PRE_COMMIT_FILE}`);
  
  console.log('✅ Verification and security hooks installed successfully');
  console.log('🔍 Pre-commit will now check:');
  console.log('   - File sizes (200 line limit)');
  console.log('   - Function existence verification');
  console.log('   - Database field verification');
  console.log('   - Security vulnerabilities (injection, auth bypass, secrets exposure)');
  console.log('');
  console.log('💡 To bypass a check, add verification comments to your code');
}

function main() {
  console.log('Installing verification hooks...');
  installHooks();
}

main();