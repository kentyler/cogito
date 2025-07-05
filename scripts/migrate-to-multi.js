#!/usr/bin/env node

/**
 * Migrate cogito directory to use cogito-multi contents while preserving git and project info
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cogitoDir = path.resolve(__dirname, '..');
const cogitoMultiDir = path.resolve(__dirname, '../../cogito-multi');

// Files/directories to preserve from the original cogito directory
const preserveFiles = [
  '.git',           // Git repository
  'README.md',      // Project documentation
  'LICENSE',        // License file
  '.gitignore',     // Git ignore rules
  'credentials.json', // Gmail credentials
  'token.json',     // Gmail token
  '.env',           // Environment variables
  'exports',        // Our personality exports
  'scripts/migrate-to-multi.js' // This script itself
];

async function migrateToMulti() {
  try {
    console.log('🔄 Starting migration from cogito-simple to cogito-multi architecture...');
    
    // 1. Backup preserved files
    console.log('📦 Backing up preserved files...');
    const backupDir = path.join(cogitoDir, '.migration-backup');
    await fs.mkdir(backupDir, { recursive: true });
    
    for (const file of preserveFiles) {
      const srcPath = path.join(cogitoDir, file);
      const backupPath = path.join(backupDir, file);
      
      try {
        const stat = await fs.stat(srcPath);
        if (stat.isDirectory()) {
          await fs.cp(srcPath, backupPath, { recursive: true });
          console.log(`  ✅ Backed up directory: ${file}`);
        } else {
          await fs.mkdir(path.dirname(backupPath), { recursive: true });
          await fs.copyFile(srcPath, backupPath);
          console.log(`  ✅ Backed up file: ${file}`);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.log(`  ⚠️  Could not backup ${file}: ${error.message}`);
        }
      }
    }
    
    // 2. Get list of all current files/directories (except preserved ones)
    console.log('🗑️  Removing old cogito-simple files...');
    const currentItems = await fs.readdir(cogitoDir);
    const itemsToRemove = currentItems.filter(item => 
      !preserveFiles.includes(item) && 
      !item.startsWith('.migration-backup')
    );
    
    for (const item of itemsToRemove) {
      const itemPath = path.join(cogitoDir, item);
      try {
        const stat = await fs.stat(itemPath);
        if (stat.isDirectory()) {
          await fs.rm(itemPath, { recursive: true, force: true });
          console.log(`  🗂️  Removed directory: ${item}`);
        } else {
          await fs.unlink(itemPath);
          console.log(`  📄 Removed file: ${item}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not remove ${item}: ${error.message}`);
      }
    }
    
    // 3. Copy all cogito-multi files
    console.log('📂 Copying cogito-multi files...');
    const multiItems = await fs.readdir(cogitoMultiDir);
    
    for (const item of multiItems) {
      // Skip if this item should be preserved from original
      if (preserveFiles.includes(item)) {
        console.log(`  ⏭️  Skipping ${item} (preserved from original)`);
        continue;
      }
      
      const srcPath = path.join(cogitoMultiDir, item);
      const destPath = path.join(cogitoDir, item);
      
      try {
        const stat = await fs.stat(srcPath);
        if (stat.isDirectory()) {
          await fs.cp(srcPath, destPath, { recursive: true });
          console.log(`  📁 Copied directory: ${item}`);
        } else {
          await fs.copyFile(srcPath, destPath);
          console.log(`  📄 Copied file: ${item}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to copy ${item}: ${error.message}`);
      }
    }
    
    // 4. Restore preserved files (in case any were overwritten)
    console.log('♻️  Restoring preserved files...');
    for (const file of preserveFiles) {
      const backupPath = path.join(backupDir, file);
      const destPath = path.join(cogitoDir, file);
      
      try {
        const stat = await fs.stat(backupPath);
        if (stat.isDirectory()) {
          // Remove any copied version first
          try {
            await fs.rm(destPath, { recursive: true, force: true });
          } catch {}
          await fs.cp(backupPath, destPath, { recursive: true });
          console.log(`  📁 Restored directory: ${file}`);
        } else {
          await fs.copyFile(backupPath, destPath);
          console.log(`  📄 Restored file: ${file}`);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.log(`  ⚠️  Could not restore ${file}: ${error.message}`);
        }
      }
    }
    
    // 5. Update package.json name to reflect it's now the main cogito
    console.log('📝 Updating package.json...');
    try {
      const packagePath = path.join(cogitoDir, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);
      
      packageData.name = 'cogito';
      packageData.description = 'Multi-personality AI coordination system with database-driven personality evolution (migrated from cogito-multi)';
      
      await fs.writeFile(packagePath, JSON.stringify(packageData, null, 2));
      console.log('  ✅ Updated package.json');
    } catch (error) {
      console.log(`  ⚠️  Could not update package.json: ${error.message}`);
    }
    
    // 6. Clean up backup
    console.log('🧹 Cleaning up backup...');
    await fs.rm(backupDir, { recursive: true, force: true });
    
    console.log('\\n🎉 Migration completed successfully!');
    console.log('\\n📋 Summary:');
    console.log('  • Preserved git repository and project files');
    console.log('  • Replaced cogito-simple with cogito-multi architecture');
    console.log('  • Updated package.json to reflect main cogito identity');
    console.log('  • Multi-personality coordination system now active');
    console.log('\\n🚀 Next steps:');
    console.log('  • Test the migrated system');
    console.log('  • Update any external references to cogito-multi');
    console.log('  • Remove the now-empty cogito-multi directory');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToMulti();
}

export { migrateToMulti };