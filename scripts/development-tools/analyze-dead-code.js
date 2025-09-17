#!/usr/bin/env node
/**
 * Dead Code Analyzer - Identifies unused functions by working backwards from entry points
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

class DeadCodeAnalyzer {
  constructor() {
    this.exportedFunctions = new Map(); // file -> [exported functions]
    this.importedFunctions = new Map(); // file -> [imported functions with sources]
    this.usedFunctions = new Set(); // Set of used function signatures
    this.entryPoints = [
      'server.js',
      'public/index.html',
      'golden-horde-app/server.js'
    ];
  }

  /**
   * Main analysis entry point
   */
  async analyze() {
    console.log('🔍 Starting dead code analysis...');
    
    // Step 1: Find all JS files (excluding node_modules, deprecated)
    const jsFiles = this.findJSFiles();
    console.log(`📁 Found ${jsFiles.length} JavaScript files`);
    
    // Step 2: Extract all exported functions
    for (const file of jsFiles) {
      this.extractExports(file);
    }
    console.log(`📤 Found ${this.exportedFunctions.size} files with exports`);
    
    // Step 3: Extract all imports and function calls
    for (const file of jsFiles) {
      this.extractImportsAndCalls(file);
    }
    
    // Step 4: Trace usage from entry points
    await this.traceUsageFromEntryPoints();
    
    // Step 5: Report unused functions
    this.reportUnusedFunctions();
    
    return this.getUnusedFunctions();
  }

  /**
   * Find all JavaScript files in the project
   */
  findJSFiles() {
    const files = [];
    
    function walkDir(dir) {
      if (dir.includes('node_modules') || 
          dir.includes('deprecated') || 
          dir.includes('.git') ||
          dir.includes('temp')) {
        return;
      }
      
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
            files.push(path.relative(projectRoot, fullPath));
          }
        }
      } catch (error) {
        // Skip unreadable directories
      }
    }
    
    walkDir(projectRoot);
    return files;
  }

  /**
   * Extract exported functions from a file
   */
  extractExports(filePath) {
    try {
      const fullPath = path.join(projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const exports = [];
      
      // Match various export patterns
      const patterns = [
        /export\s+(?:async\s+)?function\s+(\w+)/g,
        /export\s+const\s+(\w+)\s*=/g,
        /export\s+\{\s*([^}]+)\s*\}/g,
        /exports\.(\w+)\s*=/g,
        /module\.exports\s*=\s*\{([^}]+)\}/g,
        /export\s+default\s+(?:function\s+)?(\w+)/g,
        /export\s+class\s+(\w+)/g
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (pattern.source.includes('{')) {
            // Handle destructured exports like { func1, func2 }
            const items = match[1].split(',').map(item => 
              item.trim().replace(/\s+as\s+\w+/, '').trim()
            );
            exports.push(...items);
          } else {
            exports.push(match[1]);
          }
        }
      }
      
      if (exports.length > 0) {
        this.exportedFunctions.set(filePath, exports);
      }
    } catch (error) {
      console.warn(`⚠️ Could not analyze exports in ${filePath}:`, error.message);
    }
  }

  /**
   * Extract imports and function calls from a file
   */
  extractImportsAndCalls(filePath) {
    try {
      const fullPath = path.join(projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const imports = [];
      
      // Match import patterns
      const importPatterns = [
        /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g,
        /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
        /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\)/g,
        /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g
      ];
      
      for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const source = match[2];
          let functions = [];
          
          if (pattern.source.includes('{')) {
            // Handle destructured imports
            functions = match[1].split(',').map(f => f.trim().replace(/\s+as\s+\w+/, '').trim());
          } else {
            // Handle default imports
            functions = [match[1]];
          }
          
          for (const func of functions) {
            imports.push({ function: func, source, file: filePath });
            this.usedFunctions.add(`${source}:${func}`);
          }
        }
      }
      
      // Also look for direct function calls (common patterns)
      const callPatterns = [
        /(\w+)\(/g, // Simple function calls
      ];
      
      for (const pattern of callPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const funcName = match[1];
          // Skip common keywords and built-ins
          if (!['if', 'for', 'while', 'switch', 'catch', 'typeof', 'instanceof', 
                'console', 'require', 'import', 'export', 'return'].includes(funcName)) {
            this.usedFunctions.add(`${filePath}:${funcName}`);
          }
        }
      }
      
      if (imports.length > 0) {
        this.importedFunctions.set(filePath, imports);
      }
    } catch (error) {
      console.warn(`⚠️ Could not analyze imports in ${filePath}:`, error.message);
    }
  }

  /**
   * Trace usage starting from entry points
   */
  async traceUsageFromEntryPoints() {
    console.log('🔍 Tracing usage from entry points...');
    
    for (const entryPoint of this.entryPoints) {
      console.log(`📍 Analyzing entry point: ${entryPoint}`);
      this.traceFile(entryPoint, new Set()); // Prevent circular references
    }
  }

  /**
   * Recursively trace file dependencies
   */
  traceFile(filePath, visited) {
    if (visited.has(filePath)) return;
    visited.add(filePath);
    
    const imports = this.importedFunctions.get(filePath) || [];
    
    for (const imp of imports) {
      // Resolve relative imports to absolute paths
      let resolvedPath = this.resolveImportPath(imp.source, filePath);
      if (resolvedPath) {
        this.usedFunctions.add(`${resolvedPath}:${imp.function}`);
        this.traceFile(resolvedPath, visited);
      }
    }
  }

  /**
   * Resolve import paths to actual file paths
   */
  resolveImportPath(importPath, fromFile) {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const dir = path.dirname(fromFile);
      let resolved = path.resolve(projectRoot, dir, importPath);
      
      // Try adding .js extension if needed
      if (!resolved.endsWith('.js') && fs.existsSync(resolved + '.js')) {
        resolved += '.js';
      }
      
      return path.relative(projectRoot, resolved);
    }
    
    // Handle absolute imports with # prefix
    if (importPath.startsWith('#')) {
      const cleanPath = importPath.replace('#', './');
      let resolved = path.resolve(projectRoot, cleanPath);
      
      if (!resolved.endsWith('.js') && fs.existsSync(resolved + '.js')) {
        resolved += '.js';
      }
      
      if (fs.existsSync(resolved)) {
        return path.relative(projectRoot, resolved);
      }
    }
    
    return null;
  }

  /**
   * Get list of unused functions
   */
  getUnusedFunctions() {
    const unused = [];
    
    for (const [filePath, exportedFuncs] of this.exportedFunctions.entries()) {
      for (const func of exportedFuncs) {
        const signature = `${filePath}:${func}`;
        if (!this.usedFunctions.has(signature)) {
          unused.push({ file: filePath, function: func });
        }
      }
    }
    
    return unused;
  }

  /**
   * Report unused functions
   */
  reportUnusedFunctions() {
    const unused = this.getUnusedFunctions();
    
    console.log('\n📊 DEAD CODE ANALYSIS RESULTS');
    console.log('================================');
    console.log(`Total exported functions: ${Array.from(this.exportedFunctions.values()).flat().length}`);
    console.log(`Functions marked as used: ${this.usedFunctions.size}`);
    console.log(`Potentially unused functions: ${unused.length}`);
    
    if (unused.length > 0) {
      console.log('\n🚫 POTENTIALLY UNUSED FUNCTIONS:');
      console.log('=====================================');
      
      const groupedByFile = {};
      for (const { file, function: func } of unused) {
        if (!groupedByFile[file]) {
          groupedByFile[file] = [];
        }
        groupedByFile[file].push(func);
      }
      
      for (const [file, functions] of Object.entries(groupedByFile)) {
        console.log(`\n📁 ${file}:`);
        for (const func of functions) {
          console.log(`  - ${func}()`);
        }
      }
      
      console.log('\n⚠️  NOTE: Manual verification recommended before removal');
      console.log('Some functions might be used dynamically or in non-JS contexts');
    } else {
      console.log('\n✅ No unused functions detected!');
    }
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new DeadCodeAnalyzer();
  analyzer.analyze().catch(console.error);
}

export { DeadCodeAnalyzer };