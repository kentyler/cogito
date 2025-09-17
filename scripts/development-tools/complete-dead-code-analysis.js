#!/usr/bin/env node
/**
 * Complete Dead Code Analysis - Runs full analysis and categorization
 */

import { DeadCodeAnalyzer } from './analyze-dead-code.js';
import { DeadCodeCategorizer } from './categorize-dead-code.js';

async function main() {
  console.log('🔍 Starting comprehensive dead code analysis...\n');

  // Step 1: Find potentially unused functions
  const analyzer = new DeadCodeAnalyzer();
  const unusedFunctions = await analyzer.analyze();

  // Step 2: Categorize by safety for removal
  const categorizer = new DeadCodeCategorizer();
  categorizer.categorize(unusedFunctions);
  const categories = categorizer.generateRemovalPlan();

  // Step 3: Generate actionable removal script
  generateRemovalScript(categories);

  console.log('\n✅ Analysis complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Review the categorization above');
  console.log('2. Start with "safeToRemove" functions');
  console.log('3. Manually verify "likelyUnused" functions');
  console.log('4. Test thoroughly before removing "needsVerification" functions');
}

function generateRemovalScript(categories) {
  console.log('\n🔧 REMOVAL SCRIPT GENERATION');
  console.log('=============================');

  const safeToRemove = categories.safeToRemove || [];
  const likelyUnused = categories.likelyUnused || [];

  if (safeToRemove.length > 0) {
    console.log('\n# Phase 1: Safe removals');
    console.log('# These functions appear to be safe to remove');
    
    const fileGroups = groupFunctionsByFile([...safeToRemove]);
    for (const [file, functions] of Object.entries(fileGroups)) {
      console.log(`\n# Remove from ${file}:`);
      for (const func of functions) {
        console.log(`# - ${func.function}()`);
      }
    }
  }

  if (likelyUnused.length > 0) {
    console.log('\n# Phase 2: Likely unused (verify first)');
    console.log('# These functions are probably unused but need verification');
    
    const fileGroups = groupFunctionsByFile([...likelyUnused]);
    for (const [file, functions] of Object.entries(fileGroups)) {
      console.log(`\n# Verify and remove from ${file}:`);
      for (const func of functions) {
        console.log(`# - ${func.function}()`);
      }
    }
  }
}

function groupFunctionsByFile(functions) {
  const grouped = {};
  for (const func of functions) {
    if (!grouped[func.file]) {
      grouped[func.file] = [];
    }
    grouped[func.file].push(func);
  }
  return grouped;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}