#!/usr/bin/env node

/**
 * Comprehensive Database Query Cataloger
 * 
 * Scans entire codebase and extracts all database queries with context
 */

import { execSync } from 'child_process';
import fs from 'fs';

const QUERY_PATTERNS = [
  '\\.query\\(',
  '\\.connect\\(',
  'SELECT ',
  'INSERT INTO',
  'UPDATE ',
  'DELETE FROM',
  'CREATE TABLE',
  'ALTER TABLE'
];

function extractQueriesFromFiles() {
  console.log('🔍 Scanning entire codebase for database queries...\n');
  
  // Get all .js files with queries
  const queryFiles = execSync('rg "\\.query\\(" --type js -l', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(file => !file.includes('node_modules') && !file.includes('.git'));

  console.log(`📊 Found queries in ${queryFiles.length} files:\n`);
  
  const catalog = {};
  
  queryFiles.forEach(file => {
    console.log(`📄 ${file}`);
    
    try {
      // Get queries with context
      const queries = execSync(`rg "\\.query\\(" -A 5 -B 2 "${file}"`, { encoding: 'utf-8' });
      
      // Count queries in this file
      const queryCount = (queries.match(/\.query\(/g) || []).length;
      console.log(`   ${queryCount} queries found`);
      
      catalog[file] = {
        queryCount,
        queries: queries
      };
      
    } catch (error) {
      console.log(`   ❌ Error reading ${file}`);
    }
  });
  
  // Sort by query count
  const sortedFiles = Object.entries(catalog)
    .sort(([,a], [,b]) => b.queryCount - a.queryCount);
  
  console.log('\n🏆 Top 10 files by query count:');
  sortedFiles.slice(0, 10).forEach(([file, data], i) => {
    console.log(`${i + 1}. ${file}: ${data.queryCount} queries`);
  });
  
  const totalQueries = Object.values(catalog).reduce((sum, data) => sum + data.queryCount, 0);
  console.log(`\n📈 TOTAL QUERIES: ${totalQueries}`);
  
  // Save detailed catalog
  const detailedCatalog = JSON.stringify(catalog, null, 2);
  fs.writeFileSync('database-queries-detailed.json', detailedCatalog);
  
  console.log('\n💾 Detailed catalog saved to database-queries-detailed.json');
  
  return { catalog, totalQueries, sortedFiles };
}

// Run the cataloging
extractQueriesFromFiles();