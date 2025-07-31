import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // File size enforcement - prevent files from getting too large
      'max-lines': [
        'error', 
        {
          'max': 200,
          'skipBlankLines': true,
          'skipComments': true
        }
      ],
      
      // Additional rules to encourage good structure
      'max-lines-per-function': [
        'warn',
        {
          'max': 50,
          'skipBlankLines': true,
          'skipComments': true
        }
      ],
      
      'complexity': ['warn', 10],
      
      // Code quality rules
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { 'allowTemplateLiterals': true }]
    }
  },
  {
    // Override rules for test files
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    rules: {
      'max-lines': ['error', { 'max': 300 }], // Allow slightly longer test files
      'max-lines-per-function': 'off' // Test functions can be longer
    }
  },
  {
    // Ignore certain directories
    ignores: [
      'node_modules/**',
      'deprecated/**',
      'public/**',
      '.shadow-cljs/**'
    ]
  }
];