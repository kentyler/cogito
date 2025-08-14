#!/usr/bin/env node

/**
 * File size checker for pre-commit hook
 * Enforces 200-line limit for most files, 300-line limit for tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MAX_LINES_DEFAULT = 200;
const MAX_LINES_TESTS = 300;

// File extensions to check
const EXTENSIONS_TO_CHECK = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h'];

// Patterns to ignore
const IGNORE_PATTERNS = [
  '/node_modules/',
  '/.git/',
  '/build/',
  '/dist/',
  '/public/js/cljs-runtime/',
  '/.shadow-cljs/',
  '/target/',
  '.min.js',
  '.bundle.js'
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getLineCount(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return 0;
  }
}

function isTestFile(filePath) {
  const fileName = path.basename(filePath).toLowerCase();
  return fileName.includes('test') || fileName.includes('spec') || filePath.includes('/test/') || filePath.includes('/tests/');
}

function getMaxLines(filePath) {
  return isTestFile(filePath) ? MAX_LINES_TESTS : MAX_LINES_DEFAULT;
}

function main() {
  try {
    // Get list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(file => file.trim())
      .filter(file => EXTENSIONS_TO_CHECK.some(ext => file.endsWith(ext)))
      .filter(file => !shouldIgnoreFile(file))
      .filter(file => fs.existsSync(file));

    if (stagedFiles.length === 0) {
      console.log('✅ No code files to check');
      process.exit(0);
    }

    let violations = [];

    for (const file of stagedFiles) {
      const lineCount = getLineCount(file);
      const maxLines = getMaxLines(file);
      
      if (lineCount > maxLines) {
        violations.push({
          file,
          lineCount,
          maxLines,
          isTest: isTestFile(file)
        });
      }
    }

    if (violations.length === 0) {
      console.log('✅ All files are within size limits');
      process.exit(0);
    }

    // Report violations
    console.error('❌ File size violations found:');
    console.error('');
    
    for (const violation of violations) {
      console.error(`  📄 ${violation.file}: ${violation.lineCount} lines (limit: ${violation.maxLines})`);
      if (violation.isTest) {
        console.error(`     Test file - allowed up to ${MAX_LINES_TESTS} lines`);
      }
    }
    
    console.error('');
    console.error('💡 To fix these violations:');
    console.error('   - Break large files into smaller, focused modules');
    console.error('   - Extract common functionality into separate files');
    console.error('   - Use composition instead of large single files');
    console.error('');
    console.error('   File size limits help maintain code quality and AI comprehension.');
    
    process.exit(1);
    
  } catch (error) {
    console.error('Error checking file sizes:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}