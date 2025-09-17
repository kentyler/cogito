#!/usr/bin/env node

/**
 * Interactive Parameter Refactoring Agent
 * Step-by-step refactoring with user approval at each stage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';
import { SmokeTestGenerator } from './smoke-test-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class InteractiveRefactoringAgent {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Main interactive refactoring workflow
   * @param {Object} options
   * @param {string} [options.projectPath='.'] - Path to project root
   * @param {number} [options.minParams=3] - Minimum parameters to consider
   * @returns {Promise<void>}
   */
  async runInteractiveRefactoring({ projectPath = '.', minParams = 3 }) {
    console.log('🔧 Interactive Parameter Refactoring Agent');
    console.log('='.repeat(50));
    
    try {
      // Find all JavaScript files
      const jsFiles = await this.findJavaScriptFiles(projectPath);
      console.log(`📁 Found ${jsFiles.length} JavaScript files`);
      
      // Analyze all functions
      const allFunctions = [];
      for (const filePath of jsFiles) {
        const functions = await this.analyzeFunctionsInFile({ filePath, minParams });
        allFunctions.push(...functions.map(f => ({ ...f, filePath })));
      }
      
      const candidates = allFunctions.filter(f => f.parameters.length >= minParams);
      console.log(`🎯 Found ${candidates.length} functions with ${minParams}+ parameters`);
      
      if (candidates.length === 0) {
        console.log('✨ No functions need refactoring!');
        return;
      }
      
      // Process each function interactively
      for (let i = 0; i < candidates.length; i++) {
        const func = candidates[i];
        console.log(`\n📍 Function ${i + 1}/${candidates.length}`);
        
        const shouldRefactor = await this.askForFunctionRefactoring(func);
        if (!shouldRefactor) continue;
        
        await this.refactorFunction(func);
      }
      
      console.log('\n✅ Interactive refactoring complete!');
      
    } catch (error) {
      console.error('❌ Error during refactoring:', error);
    } finally {
      if (this.rl && !this.rl.closed) {
        this.rl.close();
      }
    }
  }

  /**
   * Find all JavaScript files in project
   * @param {string} projectPath - Project root path
   * @returns {Promise<Array<string>>} Array of file paths
   */
  async findJavaScriptFiles(projectPath) {
    try {
      // Use ripgrep to find JS files, excluding common ignore patterns
      const output = execSync(
        `find "${projectPath}" -name "*.js" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/deprecated/*"`,
        { encoding: 'utf-8' }
      );
      return output.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
      console.warn('⚠️ Could not use find command, falling back to fs walk');
      return this.walkDirectory(projectPath);
    }
  }

  /**
   * Recursively walk directory for JS files
   * @param {string} dir - Directory to walk
   * @returns {Promise<Array<string>>} Array of JS file paths
   */
  async walkDirectory(dir) {
    const files = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip common ignore directories
        if (['node_modules', '.git', 'dist', 'build', 'deprecated'].includes(entry.name)) {
          continue;
        }
        const subFiles = await this.walkDirectory(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Analyze functions in a single file
   * @param {Object} options
   * @param {string} options.filePath - Path to JavaScript file
   * @param {number} options.minParams - Minimum parameter count
   * @returns {Promise<Array<Object>>} Array of function definitions
   */
  async analyzeFunctionsInFile({ filePath, minParams }) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return this.extractFunctions(content);
    } catch (error) {
      console.warn(`⚠️ Could not read ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Extract function definitions from JavaScript code
   * @param {string} content - JavaScript source code
   * @returns {Array<Object>} Array of function definitions
   */
  extractFunctions(content) {
    const functions = [];
    
    // Enhanced regex patterns for different function types
    const patterns = [
      // Regular functions: function name(params) or export function name(params)
      {
        regex: /(export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
        type: 'function'
      },
      // Arrow functions: const name = (params) => or export const name = (params) =>
      {
        regex: /(export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g,
        type: 'arrow'
      }
    ];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const [fullMatch, exportKeyword, name, paramString] = match;
        const parameters = this.parseParameters(paramString);
        
        if (parameters.length > 0) {
          // Get the line number
          const beforeMatch = content.substring(0, match.index);
          const lineNumber = beforeMatch.split('\n').length;
          
          functions.push({
            name,
            parameters,
            originalSignature: fullMatch,
            startIndex: match.index,
            lineNumber,
            type,
            isExported: !!exportKeyword,
            paramString: paramString.trim()
          });
        }
      }
    });

    return functions;
  }

  /**
   * Parse parameter string into structured parameter information
   * @param {string} paramString - Raw parameter string
   * @returns {Array<Object>} Structured parameter data
   */
  parseParameters(paramString) {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map((param, index) => {
      const trimmed = param.trim();
      const hasDefault = trimmed.includes('=');
      const [name, defaultValue] = hasDefault ? 
        trimmed.split('=').map(s => s.trim()) : 
        [trimmed, null];
      
      return {
        name: name.replace(/[{}[\]]/g, ''), // Remove destructuring syntax
        hasDefault,
        defaultValue,
        isOptional: hasDefault,
        original: trimmed,
        index
      };
    });
  }

  /**
   * Ask user if they want to refactor this function
   * @param {Object} func - Function definition object
   * @returns {Promise<boolean>} User's decision
   */
  async askForFunctionRefactoring(func) {
    console.log(`\n📋 Function: ${func.name}`);
    console.log(`📍 Location: ${func.filePath}:${func.lineNumber}`);
    console.log(`📝 Current: ${func.originalSignature}`);
    console.log(`🔢 Parameters: ${func.parameters.map(p => p.name).join(', ')}`);
    
    return await this.askQuestion('\n❓ Refactor this function? (y/n/q=quit): ');
  }

  /**
   * Refactor a single function through interactive steps
   * @param {Object} func - Function definition object
   * @returns {Promise<void>}
   */
  async refactorFunction(func) {
    console.log(`\n🔨 Refactoring function: ${func.name}`);
    
    // Step 1: Show proposed function definition
    const newSignature = this.generateRefactoredSignature(func);
    console.log('\n📝 Proposed new signature:');
    console.log(newSignature);
    
    const applyDefinition = await this.askQuestion('\n❓ Apply this change to function definition? (y/n): ');
    if (!applyDefinition) return;
    
    // Step 2: Find all call sites
    console.log('\n🔍 Searching for function calls...');
    const callSites = await this.findFunctionCalls(func);
    
    if (callSites.length === 0) {
      console.log('✅ No calls found - only updating function definition');
      await this.updateFunctionDefinition(func, newSignature);
      return;
    }
    
    console.log(`📞 Found ${callSites.length} call sites:`);
    callSites.forEach((call, index) => {
      console.log(`  ${index + 1}. ${call.filePath}:${call.lineNumber} - ${call.originalCall}`);
    });
    
    // Step 3: Process each call site
    const updatedCalls = [];
    for (const callSite of callSites) {
      const shouldUpdate = await this.askForCallUpdate(callSite, func);
      if (shouldUpdate) {
        updatedCalls.push(callSite);
      }
    }
    
    // Step 4: Apply all changes
    if (updatedCalls.length > 0 || applyDefinition) {
      await this.applyRefactoring(func, newSignature, updatedCalls);
      console.log(`✅ Refactored function ${func.name} with ${updatedCalls.length} call sites updated`);
      
      // Step 5: Generate smoke test
      const shouldGenerateTest = await this.askQuestion('\n❓ Generate smoke test for this function? (y/n): ');
      if (shouldGenerateTest) {
        await this.generateSmokeTest(func);
      }
    }
  }

  /**
   * Generate refactored function signature with JSDoc
   * @param {Object} func - Function definition object
   * @returns {string} New function signature with JSDoc
   */
  generateRefactoredSignature(func) {
    // Generate JSDoc
    const jsdocLines = ['/**'];
    jsdocLines.push(` * ${this.generateFunctionDescription(func.name)}`);
    
    if (func.parameters.length > 0) {
      jsdocLines.push(' * @param {Object} options');
      func.parameters.forEach(param => {
        const type = this.inferParameterType(param);
        const optional = param.isOptional ? '[' : '';
        const closeOptional = param.isOptional ? ']' : '';
        jsdocLines.push(` * @param {${type}} ${optional}options.${param.name}${closeOptional} - ${this.generateParamDescription(param.name)}`);
      });
    }
    
    jsdocLines.push(' * @returns {Promise<Object>|Object} Description of return value');
    jsdocLines.push(' */');
    
    // Generate function signature
    const exportKeyword = func.isExported ? 'export ' : '';
    const asyncKeyword = func.originalSignature.includes('async') ? 'async ' : '';
    
    const destructuredParams = func.parameters.map(p => {
      if (p.hasDefault) {
        return `${p.name} = ${p.defaultValue}`;
      }
      return p.name;
    }).join(', ');
    
    const signature = `${exportKeyword}${asyncKeyword}function ${func.name}({ ${destructuredParams} })`;
    
    return jsdocLines.join('\n') + '\n' + signature;
  }

  /**
   * Ask user about updating a specific call site
   * @param {Object} callSite - Call site information
   * @param {Object} func - Function definition
   * @returns {Promise<boolean>} User's decision
   */
  async askForCallUpdate(callSite, func) {
    console.log(`\n📞 Call site: ${callSite.filePath}:${callSite.lineNumber}`);
    console.log(`📝 Current: ${callSite.originalCall}`);
    
    const newCall = this.generateRefactoredCall(callSite, func);
    console.log(`🔄 Proposed: ${newCall}`);
    
    return await this.askQuestion('❓ Update this call? (y/n/s=skip remaining): ');
  }

  /**
   * Generate refactored function call
   * @param {Object} callSite - Call site information  
   * @param {Object} func - Function definition
   * @returns {string} Refactored function call
   */
  generateRefactoredCall(callSite, func) {
    const args = callSite.arguments;
    const namedArgs = func.parameters.map((param, index) => {
      if (index < args.length && args[index].trim()) {
        return `${param.name}: ${args[index]}`;
      }
      return null;
    }).filter(Boolean);
    
    return `${func.name}({ ${namedArgs.join(', ')} })`;
  }

  /**
   * Find all calls to a function across the codebase
   * @param {Object} func - Function definition
   * @returns {Promise<Array<Object>>} Array of call sites
   */
  async findFunctionCalls(func) {
    // This is a simplified implementation - would need more sophisticated parsing for production
    try {
      const output = execSync(
        `grep -rn "${func.name}(" . --include="*.js" --exclude-dir=node_modules`,
        { encoding: 'utf-8' }
      );
      
      const callSites = [];
      const lines = output.trim().split('\n');
      
      for (const line of lines) {
        const [filePath, lineNumber, ...rest] = line.split(':');
        const content = rest.join(':').trim();
        
        // Skip the function definition itself
        if (content.includes('function ' + func.name)) continue;
        if (content.includes('= ' + func.name)) continue;
        
        // Extract the function call
        const callMatch = content.match(new RegExp(`${func.name}\\s*\\(([^)]*)\\)`));
        if (callMatch) {
          const args = this.parseArguments(callMatch[1]);
          callSites.push({
            filePath,
            lineNumber: parseInt(lineNumber),
            originalCall: callMatch[0],
            arguments: args,
            fullLine: content
          });
        }
      }
      
      return callSites;
    } catch (error) {
      console.warn('⚠️ Could not search for function calls:', error.message);
      return [];
    }
  }

  /**
   * Parse arguments from function call
   * @param {string} argString - Arguments string
   * @returns {Array<string>} Array of arguments
   */
  parseArguments(argString) {
    if (!argString.trim()) return [];
    
    // Simple argument parsing - would need more sophisticated parsing for complex cases
    const args = [];
    let currentArg = '';
    let parenDepth = 0;
    let inString = false;
    let stringChar = '';
    
    for (const char of argString) {
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
      } else if (!inString && char === '(') {
        parenDepth++;
      } else if (!inString && char === ')') {
        parenDepth--;
      } else if (!inString && char === ',' && parenDepth === 0) {
        args.push(currentArg.trim());
        currentArg = '';
        continue;
      }
      
      currentArg += char;
    }
    
    if (currentArg.trim()) {
      args.push(currentArg.trim());
    }
    
    return args;
  }

  /**
   * Apply the refactoring changes to files
   * @param {Object} func - Function definition
   * @param {string} newSignature - New function signature
   * @param {Array<Object>} callSites - Call sites to update
   * @returns {Promise<void>}
   */
  async applyRefactoring(func, newSignature, callSites) {
    // Update function definition
    await this.updateFunctionDefinition(func, newSignature);
    
    // Update call sites
    for (const callSite of callSites) {
      await this.updateCallSite(callSite, func);
    }
  }

  /**
   * Update function definition in file
   * @param {Object} func - Function definition
   * @param {string} newSignature - New signature with JSDoc
   * @returns {Promise<void>}
   */
  async updateFunctionDefinition(func, newSignature) {
    const content = await fs.promises.readFile(func.filePath, 'utf-8');
    const updatedContent = content.replace(func.originalSignature, newSignature.split('\n').slice(-1)[0]);
    
    // Also add JSDoc if not present
    const lines = content.split('\n');
    const funcLineIndex = func.lineNumber - 1;
    
    // Check if JSDoc already exists
    let hasJSDoc = false;
    if (funcLineIndex > 0) {
      const prevLine = lines[funcLineIndex - 1].trim();
      hasJSDoc = prevLine === '*/' || prevLine.includes('*/');
    }
    
    if (!hasJSDoc) {
      const jsdocLines = newSignature.split('\n').slice(0, -1);
      lines.splice(funcLineIndex, 0, ...jsdocLines);
    }
    
    const newContent = lines.join('\n').replace(func.originalSignature, newSignature.split('\n').slice(-1)[0]);
    await fs.promises.writeFile(func.filePath, newContent);
  }

  /**
   * Update a single call site
   * @param {Object} callSite - Call site information
   * @param {Object} func - Function definition
   * @returns {Promise<void>}
   */
  async updateCallSite(callSite, func) {
    const content = await fs.promises.readFile(callSite.filePath, 'utf-8');
    const newCall = this.generateRefactoredCall(callSite, func);
    const updatedContent = content.replace(callSite.originalCall, newCall);
    await fs.promises.writeFile(callSite.filePath, updatedContent);
  }

  // Helper methods for type inference and descriptions (reused from previous implementation)
  inferParameterType(param) {
    if (param.defaultValue) {
      if (param.defaultValue === 'null' || param.defaultValue === 'undefined') return 'any';
      if (param.defaultValue === 'true' || param.defaultValue === 'false') return 'boolean';
      if (/^\d+(\.\d+)?$/.test(param.defaultValue)) return 'number';
      if (param.defaultValue.startsWith('"') || param.defaultValue.startsWith("'")) return 'string';
      if (param.defaultValue.startsWith('[')) return 'Array';
      if (param.defaultValue.startsWith('{')) return 'Object';
    }
    
    const name = param.name.toLowerCase();
    if (name.includes('id')) return 'string|number';
    if (name.includes('count') || name.includes('num')) return 'number';
    if (name.includes('is') || name.includes('has')) return 'boolean';
    if (name.includes('callback') || name.includes('handler')) return 'Function';
    return 'any';
  }

  generateFunctionDescription(functionName) {
    return functionName.replace(/([A-Z])/g, ' $1').toLowerCase()
      .replace(/^./, str => str.toUpperCase());
  }

  generateParamDescription(paramName) {
    return paramName.replace(/([A-Z])/g, ' $1').toLowerCase()
      .replace(/^./, str => str.toUpperCase());
  }

  /**
   * Generate smoke test for a refactored function
   * @param {Object} func - Function definition object
   * @returns {Promise<void>}
   */
  async generateSmokeTest(func) {
    try {
      console.log(`\n🧪 Generating smoke test for ${func.name}...`);
      
      const testPath = await SmokeTestGenerator.generateAndSaveTest({
        functionName: func.name,
        parameters: func.parameters,
        filePath: func.filePath
      });
      
      console.log(`✅ Smoke test generated: ${testPath}`);
      
      // Ask if user wants to run the test immediately
      const shouldRunTest = await this.askQuestion('❓ Run the smoke test now? (y/n): ');
      if (shouldRunTest) {
        await this.runSmokeTest(testPath);
      }
      
    } catch (error) {
      console.error('❌ Failed to generate smoke test:', error);
    }
  }

  /**
   * Run a generated smoke test
   * @param {string} testPath - Path to test file
   * @returns {Promise<void>}
   */
  async runSmokeTest(testPath) {
    try {
      console.log(`\n🏃 Running smoke test: ${testPath}`);
      
      const result = execSync(`node "${testPath}"`, { 
        encoding: 'utf-8',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      });
      
      console.log(result);
      console.log('✅ Smoke test passed!');
      
    } catch (error) {
      console.error('❌ Smoke test failed:');
      console.error(error.stdout || error.message);
      
      const shouldContinue = await this.askQuestion('❓ Continue with refactoring despite test failure? (y/n): ');
      if (!shouldContinue) {
        throw new Error('Refactoring stopped due to test failure');
      }
    }
  }

  /**
   * Ask user a question and wait for response
   * @param {string} question - Question to ask
   * @returns {Promise<boolean>} User's response
   */
  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        const response = answer.toLowerCase().trim();
        if (response === 'q' || response === 'quit') {
          console.log('👋 Exiting...');
          process.exit(0);
        }
        if (response === 's' || response === 'skip') {
          resolve('skip');
          return;
        }
        resolve(response === 'y' || response === 'yes');
      });
    });
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new InteractiveRefactoringAgent();
  
  const projectPath = process.argv[2] || '.';
  const minParams = parseInt(process.argv[3]) || 3;
  
  agent.runInteractiveRefactoring({ projectPath, minParams })
    .catch(console.error);
}

export { InteractiveRefactoringAgent };