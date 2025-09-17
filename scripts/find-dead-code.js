#!/usr/bin/env node

/**
 * Dead Code Detector
 * Finds potentially unused functions, exports, and variables in the codebase
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'test-results'
];

const EXCLUDE_FUNCTIONS = [
  // Express middleware and route handlers are entry points
  'requireAuth',
  'requireAdmin',
  'requireClient',
  'databaseMiddleware',
  // Common lifecycle methods
  'constructor',
  'render',
  'componentDidMount',
  'componentWillUnmount',
  // Test functions
  'describe',
  'it',
  'test',
  'beforeEach',
  'afterEach',
  'beforeAll',
  'afterAll'
];

// Find all JS/TS files
function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const command = `find ${dir} -type f \\( ${extensions.map(ext => `-name "*${ext}"`).join(' -o ')} \\) 2>/dev/null | grep -v node_modules | grep -v ".git"`;
  try {
    return execSync(command, { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);
  } catch (err) {
    return [];
  }
}

// Extract exported items from a file
function extractExports(filePath) {
  const exports = {
    functions: new Set(),
    variables: new Set(),
    classes: new Set(),
    default: false
  };
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Patterns for different export types
    const patterns = {
      // export function funcName
      namedFunction: /export\s+(?:async\s+)?function\s+(\w+)/g,
      // export const/let/var name = 
      namedVariable: /export\s+(?:const|let|var)\s+(\w+)\s*=/g,
      // export class ClassName
      namedClass: /export\s+class\s+(\w+)/g,
      // export { name1, name2 }
      namedExports: /export\s+{\s*([^}]+)\s*}/g,
      // export default
      defaultExport: /export\s+default/g
    };
    
    // Extract functions
    let match;
    while ((match = patterns.namedFunction.exec(content)) !== null) {
      exports.functions.add(match[1]);
    }
    
    // Extract variables/constants
    while ((match = patterns.namedVariable.exec(content)) !== null) {
      exports.variables.add(match[1]);
    }
    
    // Extract classes
    while ((match = patterns.namedClass.exec(content)) !== null) {
      exports.classes.add(match[1]);
    }
    
    // Extract named exports
    while ((match = patterns.namedExports.exec(content)) !== null) {
      const items = match[1].split(',').map(s => s.trim());
      items.forEach(item => {
        const name = item.split(/\s+as\s+/)[0].trim();
        exports.variables.add(name);
      });
    }
    
    // Check for default export
    if (patterns.defaultExport.test(content)) {
      exports.default = true;
    }
    
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err.message}`);
  }
  
  return exports;
}

// Extract imports and usage from a file
function extractUsage(filePath) {
  const usage = {
    imports: new Set(),
    calls: new Set(),
    references: new Set()
  };
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Import patterns
    const importPatterns = [
      // import { name } from
      /import\s+{\s*([^}]+)\s*}\s+from/g,
      // import name from
      /import\s+(\w+)\s+from/g,
      // import * as name from
      /import\s+\*\s+as\s+(\w+)\s+from/g,
      // const name = require()
      /(?:const|let|var)\s+(\w+)\s*=\s*require/g,
      // const { name } = require()
      /(?:const|let|var)\s+{\s*([^}]+)\s*}\s*=\s*require/g
    ];
    
    // Extract imports
    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (pattern === importPatterns[0] || pattern === importPatterns[4]) {
          // Handle destructured imports
          const items = match[1].split(',').map(s => s.trim());
          items.forEach(item => {
            const name = item.split(/\s+as\s+/)[0].trim();
            usage.imports.add(name);
          });
        } else {
          usage.imports.add(match[1]);
        }
      }
    });
    
    // Function calls and references
    const usagePatterns = [
      // Function calls: funcName(
      /(\w+)\s*\(/g,
      // Method calls: .funcName(
      /\.(\w+)\s*\(/g,
      // Property access: .propName
      /\.(\w+)(?!\s*\()/g,
      // JSX components: <ComponentName
      /<(\w+)/g
    ];
    
    usagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        // Filter out JavaScript keywords and common methods
        if (!['if', 'for', 'while', 'switch', 'catch', 'function', 'async', 'return', 
             'await', 'new', 'throw', 'typeof', 'instanceof', 'import', 'export',
             'const', 'let', 'var', 'class', 'extends', 'super'].includes(name)) {
          usage.references.add(name);
        }
      }
    });
    
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err.message}`);
  }
  
  return usage;
}

// Main analysis
function analyzeDeadCode(directories = ['server', 'public', 'database']) {
  console.log('🔍 Analyzing codebase for dead code...\n');
  
  // Collect all files
  const allFiles = [];
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      allFiles.push(...findFiles(dir));
    }
  });
  
  console.log(`Found ${allFiles.length} files to analyze\n`);
  
  // Collect all exports
  const exportMap = new Map(); // name -> [{file, type}]
  
  allFiles.forEach(file => {
    const exports = extractExports(file);
    
    // Add functions
    exports.functions.forEach(name => {
      if (!exportMap.has(name)) {
        exportMap.set(name, []);
      }
      exportMap.get(name).push({ file, type: 'function' });
    });
    
    // Add variables
    exports.variables.forEach(name => {
      if (!exportMap.has(name)) {
        exportMap.set(name, []);
      }
      exportMap.get(name).push({ file, type: 'variable' });
    });
    
    // Add classes
    exports.classes.forEach(name => {
      if (!exportMap.has(name)) {
        exportMap.set(name, []);
      }
      exportMap.get(name).push({ file, type: 'class' });
    });
  });
  
  // Collect all usage
  const usageSet = new Set();
  
  allFiles.forEach(file => {
    const usage = extractUsage(file);
    usage.imports.forEach(name => usageSet.add(name));
    usage.references.forEach(name => usageSet.add(name));
  });
  
  // Find unused exports
  const unused = [];
  
  exportMap.forEach((locations, name) => {
    if (!usageSet.has(name) && !EXCLUDE_FUNCTIONS.includes(name)) {
      // Check if it's a route handler (common patterns)
      const isRouteHandler = locations.some(loc => 
        loc.file.includes('/routes/') || 
        loc.file.includes('/api/') ||
        loc.file.includes('router.') ||
        loc.file.includes('app.')
      );
      
      if (!isRouteHandler) {
        unused.push({ name, locations });
      }
    }
  });
  
  // Generate report
  console.log('📊 DEAD CODE ANALYSIS REPORT');
  console.log('============================\n');
  
  if (unused.length === 0) {
    console.log('✅ No dead code detected!\n');
  } else {
    console.log(`⚠️  Found ${unused.length} potentially unused exports:\n`);
    
    // Group by file
    const byFile = {};
    unused.forEach(({ name, locations }) => {
      locations.forEach(({ file, type }) => {
        if (!byFile[file]) {
          byFile[file] = [];
        }
        byFile[file].push({ name, type });
      });
    });
    
    // Print organized by file
    Object.entries(byFile)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([file, items]) => {
        console.log(`\n📄 ${file}`);
        
        // Group by type within file
        const byType = {};
        items.forEach(({ name, type }) => {
          if (!byType[type]) {
            byType[type] = [];
          }
          byType[type].push(name);
        });
        
        Object.entries(byType).forEach(([type, names]) => {
          console.log(`   ${type}s:`);
          names.sort().forEach(name => {
            console.log(`     - ${name}`);
          });
        });
      });
    
    console.log('\n\n💡 Note: Some items might be:');
    console.log('   • Entry points (route handlers, middleware)');
    console.log('   • Dynamically imported/required');
    console.log('   • Used in configuration files');
    console.log('   • External API contracts');
    console.log('   • Test utilities');
    console.log('   • Future functionality placeholders');
  }
  
  // Summary statistics
  console.log('\n📈 Statistics:');
  console.log(`   Total exports found: ${exportMap.size}`);
  console.log(`   Total usage references: ${usageSet.size}`);
  console.log(`   Potentially unused: ${unused.length}`);
  console.log(`   Usage rate: ${((1 - unused.length / exportMap.size) * 100).toFixed(1)}%\n`);
}

// Run analysis
analyzeDeadCode();

export { analyzeDeadCode, extractExports, extractUsage };