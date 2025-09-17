#!/usr/bin/env node

/**
 * Function Creation Template Generator
 * Provides templates and guidance for creating new functions with TypeScript-style JSDoc
 */

class FunctionCreationGuide {
  
  /**
   * Generate a complete function template with JSDoc
   * @param {Object} options
   * @param {string} options.functionName - Name of the function
   * @param {Array<string>} options.parameterNames - Array of parameter names
   * @param {boolean} [options.isAsync=false] - Whether function should be async
   * @param {boolean} [options.isExported=false] - Whether function should be exported
   * @param {string} [options.description] - Custom function description
   * @returns {string} Complete function template
   */
  static generateFunctionTemplate({ 
    functionName, 
    parameterNames = [], 
    isAsync = false, 
    isExported = false, 
    description 
  }) {
    const jsdoc = this.generateTemplateJSDoc({
      functionName,
      parameterNames,
      description,
      isAsync
    });
    
    const signature = this.generateSignature({
      functionName,
      parameterNames,
      isAsync,
      isExported
    });
    
    const body = this.generateFunctionBody({ functionName, isAsync });
    
    return `${jsdoc}\n${signature} {\n${body}\n}`;
  }

  /**
   * Generate TypeScript-style JSDoc for new functions
   * @param {Object} options
   * @param {string} options.functionName - Name of the function
   * @param {Array<string>} options.parameterNames - Array of parameter names
   * @param {string} [options.description] - Custom description
   * @param {boolean} [options.isAsync=false] - Whether function is async
   * @returns {string} JSDoc comment block
   */
  static generateTemplateJSDoc({ functionName, parameterNames, description, isAsync = false }) {
    const lines = ['/**'];
    
    // Add description
    const desc = description || this.generateDescriptionFromName(functionName);
    lines.push(` * ${desc}`);
    
    // Add parameters if any
    if (parameterNames.length > 0) {
      lines.push(` * @param {Object} options`);
      parameterNames.forEach(param => {
        const type = this.inferTypeFromName(param);
        const paramDesc = this.generateParamDescription(param);
        lines.push(` * @param {${type}} options.${param} - ${paramDesc}`);
      });
    }
    
    // Add return type
    const returnType = isAsync ? 'Promise<Object>' : 'Object';
    lines.push(` * @returns {${returnType}} Description of return value`);
    lines.push(` */`);
    
    return lines.join('\n');
  }

  /**
   * Generate function signature with object destructuring
   * @param {Object} options
   * @param {string} options.functionName - Name of the function
   * @param {Array<string>} options.parameterNames - Array of parameter names
   * @param {boolean} [options.isAsync=false] - Whether function is async
   * @param {boolean} [options.isExported=false] - Whether function is exported
   * @returns {string} Function signature
   */
  static generateSignature({ functionName, parameterNames, isAsync = false, isExported = false }) {
    const exportKeyword = isExported ? 'export ' : '';
    const asyncKeyword = isAsync ? 'async ' : '';
    
    let params = '';
    if (parameterNames.length > 0) {
      params = `{ ${parameterNames.join(', ')} }`;
    }
    
    return `${exportKeyword}${asyncKeyword}function ${functionName}(${params})`;
  }

  /**
   * Generate basic function body template
   * @param {Object} options
   * @param {string} options.functionName - Name of the function
   * @param {boolean} [options.isAsync=false] - Whether function is async
   * @returns {string} Function body template
   */
  static generateFunctionBody({ functionName, isAsync = false }) {
    const lines = [
      '  try {',
      '    // TODO: Implement function logic',
      '    ',
      '    return {',
      '      success: true',
      '    };',
      '  } catch (error) {',
      `    console.error('Error in ${functionName}:', error);`,
      '    throw error;',
      '  }'
    ];
    
    return lines.join('\n');
  }

  /**
   * Generate description from function name
   * @param {string} functionName - Name of the function
   * @returns {string} Generated description
   */
  static generateDescriptionFromName(functionName) {
    // Convert camelCase/PascalCase to sentence
    const words = functionName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    return words;
  }

  /**
   * Generate parameter description from name
   * @param {string} paramName - Parameter name
   * @returns {string} Generated description
   */
  static generateParamDescription(paramName) {
    const words = paramName
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  /**
   * Infer parameter type from name
   * @param {string} paramName - Parameter name
   * @returns {string} TypeScript type
   */
  static inferTypeFromName(paramName) {
    const name = paramName.toLowerCase();
    
    // ID patterns
    if (name.includes('id')) return 'string|number';
    
    // Number patterns
    if (name.includes('count') || name.includes('num') || name.includes('index') || 
        name.includes('size') || name.includes('length') || name.includes('amount')) {
      return 'number';
    }
    
    // Boolean patterns
    if (name.startsWith('is') || name.startsWith('has') || name.startsWith('should') || 
        name.startsWith('can') || name.includes('enabled') || name.includes('active')) {
      return 'boolean';
    }
    
    // Function patterns
    if (name.includes('callback') || name.includes('handler') || name.includes('fn') || 
        name.startsWith('on')) {
      return 'Function';
    }
    
    // Array patterns
    if (name.endsWith('s') && !name.endsWith('ss') && !name.endsWith('us')) {
      return 'Array';
    }
    
    // Date patterns
    if (name.includes('date') || name.includes('time') || name.includes('created') || 
        name.includes('updated')) {
      return 'Date|string';
    }
    
    // Default to string
    return 'string';
  }

  /**
   * Provide templates for common function patterns
   * @returns {Object} Object containing various function templates
   */
  static getCommonTemplates() {
    return {
      apiHandler: `/**
 * Handle API request for resource operation
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {Object} options.res - Express response object
 * @returns {Promise<Object>} API response
 */
export async function handleResourceOperation({ req, res }) {
  try {
    // TODO: Implement API logic
    
    return res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in handleResourceOperation:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}`,

      dataProcessor: `/**
 * Process data with specified options
 * @param {Object} options
 * @param {Array} options.data - Data to process
 * @param {Object} [options.config={}] - Processing configuration
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object>} Processing results
 */
export async function processData({ data, config = {}, onProgress }) {
  try {
    const results = [];
    
    for (let i = 0; i < data.length; i++) {
      // TODO: Process each item
      const result = await processItem(data[i], config);
      results.push(result);
      
      if (onProgress) {
        onProgress({ processed: i + 1, total: data.length });
      }
    }
    
    return {
      success: true,
      results,
      totalProcessed: results.length
    };
  } catch (error) {
    console.error('Error in processData:', error);
    throw error;
  }
}`,

      validator: `/**
 * Validate input data against schema
 * @param {Object} options
 * @param {Object} options.data - Data to validate
 * @param {Object} options.schema - Validation schema
 * @param {boolean} [options.strict=false] - Whether to use strict validation
 * @returns {Object} Validation results
 */
export function validateData({ data, schema, strict = false }) {
  try {
    const errors = [];
    const warnings = [];
    
    // TODO: Implement validation logic
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    console.error('Error in validateData:', error);
    throw error;
  }
}`
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const functionName = process.argv[2];
  const params = process.argv.slice(3);
  
  if (!functionName) {
    console.log('Usage: node function-creation-template.js <functionName> [param1] [param2] ...');
    console.log('\nCommon templates:');
    console.log('  --api-handler    Generate API handler template');
    console.log('  --data-processor Generate data processor template');
    console.log('  --validator      Generate validator template');
    process.exit(1);
  }
  
  if (functionName.startsWith('--')) {
    const templates = FunctionCreationGuide.getCommonTemplates();
    let templateName = functionName.slice(2).replace(/-/g, '');
    // Convert kebab-case to camelCase
    templateName = templateName.replace(/^[a-z]/, match => match.toLowerCase());
    templateName = templateName.replace(/([a-z])([A-Z])/g, '$1$2');
    
    // Try direct match first
    if (templates[templateName]) {
      console.log(templates[templateName]);
    }
    // Try common mappings
    else if (templateName === 'apihandler') {
      console.log(templates['apiHandler']);
    }
    else if (templateName === 'dataprocessor') {
      console.log(templates['dataProcessor']);
    }
    else {
      console.log('Template not found. Available templates:', Object.keys(templates));
      console.log('Use: --api-handler, --data-processor, --validator');
    }
  } else {
    const template = FunctionCreationGuide.generateFunctionTemplate({
      functionName,
      parameterNames: params,
      isAsync: true,
      isExported: true
    });
    
    console.log(template);
  }
}

export { FunctionCreationGuide };