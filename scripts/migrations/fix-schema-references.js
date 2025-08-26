#!/usr/bin/env node

/**
 * Fix conversation schema references throughout the codebase
 * Changes conversation.meetings -> meetings, conversation.turns -> turns, etc.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Schema mappings
const schemaMappings = {
  'conversation.meetings': 'meetings',
  'conversation.turns': 'turns', 
  'conversation.meeting_files': 'meeting_files',
  'conversation.participants': 'participants',
  'conversation.blocks': 'blocks'
};

// Directories to process
const dirsToProcess = [
  'server',
  'lib',
  'scripts',
  'examples',
  'tests'
];

// Files to exclude
const excludePatterns = [
  /node_modules/,
  /deprecated/,
  /\.git/,
  /-original\./,
  /fix-schema-references\.js$/
];

async function findJSFiles(directory) {
  const files = [];
  
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      // Skip excluded patterns
      if (excludePatterns.some(pattern => pattern.test(fullPath))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        const subFiles = await findJSFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist, skip it
    console.log(`Skipping ${directory} (not found)`);
  }
  
  return files;
}

async function fixSchemaReferences(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    // Apply each schema mapping
    for (const [oldSchema, newSchema] of Object.entries(schemaMappings)) {
      const regex = new RegExp(oldSchema.replace('.', '\\.'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newSchema);
        changed = true;
      }
    }
    
    if (changed) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(projectRoot, filePath)}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🔧 Fixing conversation schema references...\n');
  
  let totalFixed = 0;
  let totalFiles = 0;
  
  for (const dir of dirsToProcess) {
    const dirPath = path.join(projectRoot, dir);
    const files = await findJSFiles(dirPath);
    
    console.log(`📁 Processing ${dir}/ (${files.length} files)`);
    
    for (const file of files) {
      totalFiles++;
      const fixed = await fixSchemaReferences(file);
      totalFixed += fixed;
    }
  }
  
  console.log(`\n🎉 Complete! Fixed ${totalFixed} files out of ${totalFiles} processed.`);
  
  // Show what schemas were changed
  console.log('\n📋 Schema mappings applied:');
  for (const [old, newSchema] of Object.entries(schemaMappings)) {
    console.log(`  ${old} → ${newSchema}`);
  }
}

main().catch(console.error);