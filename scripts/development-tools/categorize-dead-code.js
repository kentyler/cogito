#!/usr/bin/env node
/**
 * Dead Code Categorizer - Categorizes potentially unused code for safer removal
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

class DeadCodeCategorizer {
  constructor() {
    this.categories = {
      safeToRemove: [],
      likelyUnused: [],
      needsVerification: [],
      keepForNow: []
    };
  }

  /**
   * Categorize potentially unused functions
   */
  categorize(unusedFunctions) {
    for (const { file, function: func } of unusedFunctions) {
      const category = this.determineCategory(file, func);
      this.categories[category].push({ file, function: func });
    }
  }

  /**
   * Determine the safety category for a function
   */
  determineCategory(file, func) {
    // Test files - generally safe to keep test utilities
    if (file.includes('test') || file.includes('spec')) {
      return 'keepForNow';
    }

    // Deprecated folder - definitely safe to remove
    if (file.includes('deprecated')) {
      return 'safeToRemove';
    }

    // AI agents - likely experimental/unused
    if (file.includes('ai-agents/')) {
      // Check if it's part of current functionality
      const agentTypes = ['speaker-profile', 'turn-embedding', 'game-state'];
      const isUnusedAgent = agentTypes.some(type => file.includes(type));
      return isUnusedAgent ? 'likelyUnused' : 'needsVerification';
    }

    // Classification modules - likely experimental
    if (file.includes('classification/')) {
      return 'likelyUnused';
    }

    // Development tools - safe to remove if unused
    if (file.includes('scripts/development-tools/') || file.includes('db-cli/')) {
      return 'safeToRemove';
    }

    // Route handlers - need verification (might be dynamically loaded)
    if (file.includes('server/routes/') || file.includes('routes/')) {
      return 'needsVerification';
    }

    // Services - likely need verification
    if (file.includes('services/')) {
      return 'needsVerification';
    }

    // Upload/file processing - might be used in frontend
    if (file.includes('uploads/') || file.includes('file-upload/')) {
      return 'needsVerification';
    }

    // Configuration files - keep for now
    if (file.includes('config/')) {
      return 'keepForNow';
    }

    // Database operations - need careful verification
    if (file.includes('database/')) {
      return 'needsVerification';
    }

    // Public/frontend JavaScript - might be referenced in HTML
    if (file.includes('public/')) {
      return 'needsVerification';
    }

    // Default - needs verification
    return 'needsVerification';
  }

  /**
   * Check if function might be used dynamically
   */
  checkDynamicUsage(file, func) {
    const checks = [];

    // Check if mentioned in HTML files
    const htmlFiles = this.findFiles('**/*.html');
    for (const htmlFile of htmlFiles) {
      if (this.fileContains(htmlFile, func)) {
        checks.push(`Referenced in ${htmlFile}`);
      }
    }

    // Check if mentioned in JSON/config files
    const configFiles = this.findFiles('**/package.json', '**/*.json', '**/*.config.js');
    for (const configFile of configFiles) {
      if (this.fileContains(configFile, func)) {
        checks.push(`Referenced in ${configFile}`);
      }
    }

    // Check if exported for external use
    if (func.charAt(0) === func.charAt(0).toUpperCase()) {
      checks.push('Class/Constructor - might be used externally');
    }

    return checks;
  }

  /**
   * Find files matching patterns
   */
  findFiles(...patterns) {
    const files = [];
    // Simplified file search - in real implementation would use glob
    try {
      this.walkDir(projectRoot, (filePath) => {
        for (const pattern of patterns) {
          const ext = pattern.split('.').pop();
          if (filePath.endsWith('.' + ext)) {
            files.push(filePath);
          }
        }
      });
    } catch (error) {
      // Ignore errors
    }
    return files;
  }

  /**
   * Walk directory recursively
   */
  walkDir(dir, callback) {
    if (dir.includes('node_modules') || dir.includes('.git')) return;
    
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.walkDir(fullPath, callback);
        } else {
          callback(fullPath);
        }
      }
    } catch (error) {
      // Skip unreadable directories
    }
  }

  /**
   * Check if file contains a string
   */
  fileContains(filePath, searchString) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes(searchString);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate removal plan
   */
  generateRemovalPlan() {
    console.log('\n🗂️  DEAD CODE CATEGORIZATION');
    console.log('==============================');

    for (const [category, functions] of Object.entries(this.categories)) {
      if (functions.length === 0) continue;

      console.log(`\n📁 ${category.toUpperCase()} (${functions.length} functions):`);
      console.log('-'.repeat(50));

      const grouped = this.groupByFile(functions);
      for (const [file, funcs] of Object.entries(grouped)) {
        console.log(`\n  📄 ${file}:`);
        for (const func of funcs) {
          console.log(`    - ${func.function}()`);
        }
      }
    }

    // Generate summary
    console.log('\n📊 REMOVAL RECOMMENDATIONS:');
    console.log('============================');
    console.log(`✅ Safe to remove: ${this.categories.safeToRemove.length} functions`);
    console.log(`⚠️  Likely unused (verify first): ${this.categories.likelyUnused.length} functions`);
    console.log(`🔍 Needs verification: ${this.categories.needsVerification.length} functions`);
    console.log(`📌 Keep for now: ${this.categories.keepForNow.length} functions`);

    return this.categories;
  }

  /**
   * Group functions by file
   */
  groupByFile(functions) {
    const grouped = {};
    for (const func of functions) {
      if (!grouped[func.file]) {
        grouped[func.file] = [];
      }
      grouped[func.file].push(func);
    }
    return grouped;
  }
}

export { DeadCodeCategorizer };