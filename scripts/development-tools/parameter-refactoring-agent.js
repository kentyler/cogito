#!/usr/bin/env node

/**
 * Parameter Refactoring Agent
 * Converts functions from positional parameters to object destructuring with TypeScript-style JSDoc
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ParameterRefactoringAgent {
  constructor() {
    this.functionRegistry = new Map();
    this.callSites = new Map();
  }

  /**
   * Analyze a JavaScript file for functions that need refactoring
   * @param {Object} options
   * @param {string} options.filePath - Path to the JavaScript file
   * @param {number} [options.minParams=3] - Minimum parameters to trigger refactoring
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFile({ filePath, minParams = 3 }) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const functions = this.extractFunctions(content);
    
    return {
      functions: functions.filter(f => f.parameters.length >= minParams),
      filePath
    };
  }

  /**
   * Extract function definitions from JavaScript code
   * @param {string} content - JavaScript source code
   * @returns {Array<Object>} Array of function definitions
   */
  extractFunctions(content) {
    const functions = [];
    
    // Regex patterns for different function types
    const patterns = [
      // Regular functions: function name(params)
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
      // Arrow functions: const name = (params) => or export const name = (params) =>
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g,
      // Method definitions: methodName(params)
      /(\w+)\s*\(([^)]*)\)\s*{/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [fullMatch, name, paramString] = match;
        const parameters = this.parseParameters(paramString);
        
        if (parameters.length > 0) {
          functions.push({
            name,
            parameters,
            originalSignature: fullMatch,
            startIndex: match.index,
            paramString: paramString.trim()
          });
        }
      }
    });

    return functions;
  }

  /**
   * Parse parameter string into structured parameter information
   * @param {string} paramString - Raw parameter string from function signature
   * @returns {Array<Object>} Structured parameter data
   */
  parseParameters(paramString) {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => {
      const trimmed = param.trim();
      const hasDefault = trimmed.includes('=');
      const [name, defaultValue] = hasDefault ? trimmed.split('=').map(s => s.trim()) : [trimmed, null];
      
      return {
        name: name.replace(/[{}[\]]/g, ''), // Remove destructuring syntax
        hasDefault,
        defaultValue,
        isOptional: hasDefault || name.includes('?'),
        original: trimmed
      };
    });
  }

  /**
   * Generate object destructuring signature with TypeScript JSDoc
   * @param {Object} options
   * @param {string} options.functionName - Name of the function
   * @param {Array<Object>} options.parameters - Parameter definitions
   * @param {boolean} [options.isAsync=false] - Whether function is async
   * @param {boolean} [options.isExported=false] - Whether function is exported
   * @returns {string} Refactored function signature with JSDoc
   */
  generateRefactoredSignature({ functionName, parameters, isAsync = false, isExported = false }) {
    // Generate JSDoc
    const jsdoc = this.generateJSDoc({ functionName, parameters });
    
    // Generate parameter destructuring
    const destructuredParams = parameters.map(p => {
      if (p.hasDefault) {
        return `${p.name} = ${p.defaultValue}`;
      }
      return p.name;
    }).join(', ');

    // Build function signature
    const exportKeyword = isExported ? 'export ' : '';
    const asyncKeyword = isAsync ? 'async ' : '';
    
    const signature = `${exportKeyword}${asyncKeyword}function ${functionName}({ ${destructuredParams} })`;
    
    return `${jsdoc}\n${signature}`;
  }

  /**
   * Generate TypeScript-style JSDoc documentation
   * @param {Object} options
   * @param {string} options.functionName - Name of the function
   * @param {Array<Object>} options.parameters - Parameter definitions
   * @returns {string} JSDoc comment block
   */
  generateJSDoc({ functionName, parameters }) {
    const lines = [`/**`];
    
    // Add description placeholder
    lines.push(` * ${this.generateFunctionDescription(functionName)}`);
    
    // Add parameters section
    if (parameters.length > 0) {
      lines.push(` * @param {Object} options`);
      parameters.forEach(param => {
        const optional = param.isOptional ? '[' : '';
        const closeOptional = param.isOptional ? ']' : '';
        const type = this.inferParameterType(param);
        lines.push(` * @param {${type}} ${optional}options.${param.name}${closeOptional} - ${this.generateParamDescription(param.name)}`);
      });
    }
    
    // Add return type placeholder
    lines.push(` * @returns {Promise<Object>|Object} Description of return value`);
    lines.push(` */`);
    
    return lines.join('\n');
  }

  /**
   * Infer TypeScript type from parameter information
   * @param {Object} param - Parameter object
   * @returns {string} TypeScript type annotation
   */
  inferParameterType(param) {
    if (param.defaultValue) {
      // Try to infer from default value
      if (param.defaultValue === 'null' || param.defaultValue === 'undefined') {
        return 'any';
      }
      if (param.defaultValue === 'true' || param.defaultValue === 'false') {
        return 'boolean';
      }
      if (/^\d+(\.\d+)?$/.test(param.defaultValue)) {
        return 'number';
      }
      if (param.defaultValue.startsWith('"') || param.defaultValue.startsWith("'")) {
        return 'string';
      }
      if (param.defaultValue.startsWith('[')) {
        return 'Array';
      }
      if (param.defaultValue.startsWith('{')) {
        return 'Object';
      }
    }
    
    // Default type inference based on parameter name patterns
    if (param.name.toLowerCase().includes('id')) return 'string|number';
    if (param.name.toLowerCase().includes('count') || param.name.toLowerCase().includes('num')) return 'number';
    if (param.name.toLowerCase().includes('is') || param.name.toLowerCase().includes('has')) return 'boolean';
    if (param.name.toLowerCase().includes('callback') || param.name.toLowerCase().includes('handler')) return 'Function';
    
    return 'any';
  }

  /**
   * Generate function description from function name
   * @param {string} functionName - Name of the function
   * @returns {string} Generated description
   */
  generateFunctionDescription(functionName) {
    // Convert camelCase to sentence
    const words = functionName.replace(/([A-Z])/g, ' $1').toLowerCase();
    return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
  }

  /**
   * Generate parameter description from parameter name
   * @param {string} paramName - Name of the parameter
   * @returns {string} Generated description
   */
  generateParamDescription(paramName) {
    // Convert camelCase to sentence
    const words = paramName.replace(/([A-Z])/g, ' $1').toLowerCase();
    return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
  }

  /**
   * Find and analyze all function call sites
   * @param {Object} options
   * @param {string} options.functionName - Name of function to find calls for
   * @param {string} options.projectPath - Root path to search
   * @returns {Promise<Array<Object>>} Array of call site information
   */
  async findCallSites({ functionName, projectPath }) {
    // Implementation would recursively search files
    // This is a placeholder for the full implementation
    return [];
  }

  /**
   * Refactor a function call from positional to object parameters
   * @param {Object} options
   * @param {string} options.originalCall - Original function call code
   * @param {Array<Object>} options.parameters - Parameter definitions
   * @returns {string} Refactored function call
   */
  refactorFunctionCall({ originalCall, parameters }) {
    // Parse the original call to extract arguments
    const args = this.parseArguments(originalCall);
    
    // Map positional arguments to named parameters
    const namedArgs = parameters.map((param, index) => {
      if (index < args.length) {
        return `${param.name}: ${args[index]}`;
      }
      return null;
    }).filter(Boolean);

    // Generate new call
    const functionName = originalCall.split('(')[0];
    return `${functionName}({ ${namedArgs.join(', ')} })`;
  }

  /**
   * Parse arguments from a function call
   * @param {string} callString - Function call string
   * @returns {Array<string>} Array of argument strings
   */
  parseArguments(callString) {
    const match = callString.match(/\(([^)]*)\)/);
    if (!match || !match[1]) return [];
    
    // Simple argument parsing - would need more sophisticated parsing for complex cases
    return match[1].split(',').map(arg => arg.trim()).filter(arg => arg.length > 0);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new ParameterRefactoringAgent();
  
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('Usage: node parameter-refactoring-agent.js <file-path>');
    process.exit(1);
  }
  
  agent.analyzeFile({ filePath })
    .then(result => {
      console.log('Functions that could be refactored:');
      result.functions.forEach(func => {
        console.log(`\n${func.name}:`);
        console.log('  Current:', func.originalSignature);
        console.log('  Refactored:');
        console.log(agent.generateRefactoredSignature({
          functionName: func.name,
          parameters: func.parameters
        }));
      });
    })
    .catch(console.error);
}

export { ParameterRefactoringAgent };