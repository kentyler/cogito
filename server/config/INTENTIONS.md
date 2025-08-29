# Server Configuration

## Purpose
Centralized configuration management for all server components, external services, and application settings. Provides environment-aware configuration loading, provider initialization, and middleware setup.

## Configuration Philosophy
- **Environment-Aware**: Different settings for development, staging, and production
- **Secure Defaults**: Secure configuration defaults with explicit overrides
- **Provider Abstraction**: Clean interfaces for external service providers
- **Validation**: Configuration validation and error reporting
- **Centralized**: Single source of truth for all configuration

## Core Configuration Files

### `environment-fallback.js`
**Purpose**: Environment variable management with secure fallbacks
- Provides environment variable loading with type validation
- Implements secure fallback values for missing configuration
- Handles environment-specific overrides
- Validates required configuration values

```javascript
export function getEnvVar(key, defaultValue, options = {}) {
  // 1. Read environment variable value
  // 2. Apply type conversion if specified
  // 3. Validate against allowed values if provided
  // 4. Return validated value or secure default
  // 5. Log configuration warnings for missing values
}

export function validateRequiredEnv(requiredVars) {
  // 1. Check all required environment variables
  // 2. Collect missing or invalid variables
  // 3. Generate detailed error messages
  // 4. Throw configuration error if critical values missing
}
```

### `database.js`
**Purpose**: Database connection and configuration management
- Configures PostgreSQL connection pools
- Manages connection settings and timeouts
- Handles SSL configuration for different environments
- Provides connection health checking

```javascript
export function createDatabasePool() {
  // 1. Load database configuration from environment
  // 2. Apply environment-specific connection settings
  // 3. Configure SSL based on environment
  // 4. Set up connection pool with appropriate limits
  // 5. Add connection event handlers
  // 6. Return configured database pool
}

export function getDatabaseConfig() {
  return {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvVar('DB_PORT', 5432, { type: 'number' }),
    database: getEnvVar('DB_NAME', 'cogito'),
    user: getEnvVar('DB_USER', 'cogito_user'),
    password: getEnvVar('DB_PASSWORD', '', { required: true }),
    ssl: getSSLConfig(),
    pool: getPoolConfig()
  };
}
```

### `llm-providers.js`
**Purpose**: LLM provider configuration and initialization
- Configures multiple LLM providers (Anthropic, OpenAI, etc.)
- Manages API keys and authentication
- Sets provider-specific defaults and limits
- Handles provider availability and fallbacks

```javascript
export function initializeLLMProviders() {
  // 1. Load provider configurations from environment
  // 2. Validate API keys and authentication
  // 3. Initialize provider instances
  // 4. Configure provider-specific settings
  // 5. Set up provider health monitoring
  // 6. Return provider registry
}

export function getAnthropicConfig() {
  return {
    apiKey: getEnvVar('ANTHROPIC_API_KEY', '', { required: true }),
    model: getEnvVar('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022'),
    maxTokens: getEnvVar('ANTHROPIC_MAX_TOKENS', 4000, { type: 'number' }),
    temperature: getEnvVar('ANTHROPIC_TEMPERATURE', 0.7, { type: 'number' }),
    baseURL: getEnvVar('ANTHROPIC_BASE_URL', 'https://api.anthropic.com')
  };
}
```

### `email.js`
**Purpose**: Email service configuration and provider setup
- Configures email providers (SMTP, SendGrid, etc.)
- Manages email templates and formatting
- Sets up email authentication and security
- Handles email delivery and retry logic

```javascript
export function initializeEmailService() {
  // 1. Determine email provider from environment
  // 2. Load provider-specific configuration
  // 3. Validate authentication credentials
  // 4. Configure email templates and defaults
  // 5. Set up delivery monitoring
  // 6. Return configured email service
}

export function getEmailConfig() {
  const provider = getEnvVar('EMAIL_PROVIDER', 'smtp');
  
  const configs = {
    smtp: getSMTPConfig(),
    sendgrid: getSendGridConfig(),
    ses: getAWSConfig()
  };
  
  return {
    provider: provider,
    config: configs[provider],
    from: getEnvVar('EMAIL_FROM', 'noreply@cogito.ai'),
    templates: getEmailTemplateConfig()
  };
}
```

### `cors.js`
**Purpose**: CORS (Cross-Origin Resource Sharing) configuration
- Configures allowed origins for different environments
- Sets up CORS headers and policies
- Handles preflight requests
- Manages credential sharing policies

```javascript
export function configureCORS() {
  // 1. Load allowed origins from environment
  // 2. Configure CORS headers based on environment
  // 3. Set up preflight request handling
  // 4. Configure credential sharing policies
  // 5. Add security headers
  // 6. Return CORS middleware configuration
}

export function getAllowedOrigins() {
  const origins = getEnvVar('ALLOWED_ORIGINS', 'http://localhost:3000');
  return origins.split(',').map(origin => origin.trim());
}
```

### `middleware.js`
**Purpose**: Express middleware configuration and setup
- Configures standard Express middleware stack
- Sets up request parsing and validation
- Configures session management
- Manages security middleware

```javascript
export function configureMiddleware(app) {
  // 1. Configure request parsing middleware
  // 2. Set up session management
  // 3. Configure security headers
  // 4. Set up CORS handling
  // 5. Configure logging middleware
  // 6. Add error handling middleware
}

export function getSessionConfig() {
  return {
    secret: getEnvVar('SESSION_SECRET', '', { required: true }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: getEnvVar('NODE_ENV') === 'production',
      httpOnly: true,
      maxAge: getEnvVar('SESSION_MAX_AGE', 24 * 60 * 60 * 1000, { type: 'number' })
    }
  };
}
```

### `database-provider-loader.js`
**Purpose**: Database provider loading and connection management
- Loads appropriate database provider based on environment
- Manages connection pooling and lifecycle
- Handles database provider switching
- Provides database health monitoring

```javascript
export function loadDatabaseProvider() {
  // 1. Determine database provider from configuration
  // 2. Load provider-specific connection library
  // 3. Configure connection parameters
  // 4. Set up connection pool
  // 5. Initialize health monitoring
  // 6. Return database provider instance
}

export function createConnectionPool(config) {
  // 1. Validate database configuration
  // 2. Create connection pool with specified settings
  // 3. Configure connection timeout and retry logic
  // 4. Set up connection event handlers
  // 5. Add pool monitoring and metrics
  // 6. Return configured connection pool
}
```

### `provider-initializers.js`
**Purpose**: External service provider initialization coordination
- Coordinates initialization of all external service providers
- Manages provider dependency resolution
- Handles initialization order and dependencies
- Provides provider health status aggregation

```javascript
export async function initializeAllProviders() {
  // 1. Initialize database providers first
  // 2. Initialize LLM providers
  // 3. Initialize email providers
  // 4. Initialize external API providers
  // 5. Validate all provider health
  // 6. Return provider registry
}

export async function validateProviderHealth(providers) {
  // 1. Check connectivity to all providers
  // 2. Validate authentication and permissions
  // 3. Test basic provider functionality
  // 4. Report provider status
  // 5. Handle provider failures gracefully
}
```

## Configuration Loading Pipeline

### Environment-Based Configuration
```javascript
export class ConfigurationLoader {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = {};
  }
  
  loadConfiguration() {
    // 1. Load base configuration
    this.config = this.loadBaseConfig();
    
    // 2. Apply environment-specific overrides
    this.config = this.applyEnvironmentOverrides(this.config);
    
    // 3. Validate configuration
    this.validateConfiguration(this.config);
    
    // 4. Initialize providers
    this.initializeProviders(this.config);
    
    return this.config;
  }
  
  loadBaseConfig() {
    return {
      server: {
        port: getEnvVar('PORT', 3001, { type: 'number' }),
        host: getEnvVar('HOST', '0.0.0.0')
      },
      database: getDatabaseConfig(),
      llm: getLLMProvidersConfig(),
      email: getEmailConfig(),
      session: getSessionConfig()
    };
  }
}
```

### Provider Health Monitoring
```javascript
export class ProviderHealthMonitor {
  constructor(providers) {
    this.providers = providers;
    this.healthStatus = new Map();
  }
  
  async monitorProviderHealth() {
    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        this.healthStatus.set(name, {
          status: 'healthy',
          lastCheck: new Date(),
          response: health
        });
      } catch (error) {
        this.healthStatus.set(name, {
          status: 'unhealthy',
          lastCheck: new Date(),
          error: error.message
        });
        console.error(`Provider ${name} health check failed:`, error);
      }
    }
  }
  
  getHealthSummary() {
    const summary = {};
    for (const [name, status] of this.healthStatus) {
      summary[name] = {
        status: status.status,
        lastCheck: status.lastCheck
      };
    }
    return summary;
  }
}
```

## Security Configuration

### Secure Defaults
```javascript
export const SECURITY_DEFAULTS = {
  session: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  cors: {
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
  },
  
  database: {
    ssl: process.env.NODE_ENV === 'production',
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20 // connection pool size
  }
};
```

### Configuration Validation
```javascript
export function validateSecurityConfig(config) {
  const errors = [];
  
  // Check for required security settings
  if (!config.session?.secret) {
    errors.push('SESSION_SECRET is required');
  }
  
  if (config.session?.secret?.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters');
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (!config.database.ssl) {
      errors.push('Database SSL is required in production');
    }
    
    if (!config.session.secure) {
      errors.push('Secure session cookies required in production');
    }
  }
  
  if (errors.length > 0) {
    throw new ConfigurationError('Security configuration errors', errors);
  }
}
```

## Environment-Specific Settings

### Development Configuration
```javascript
export const DEVELOPMENT_CONFIG = {
  database: {
    ssl: false,
    pool: { min: 2, max: 10 }
  },
  logging: {
    level: 'debug',
    queries: true
  },
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001']
  }
};
```

### Production Configuration
```javascript
export const PRODUCTION_CONFIG = {
  database: {
    ssl: { rejectUnauthorized: true },
    pool: { min: 5, max: 50 }
  },
  logging: {
    level: 'error',
    queries: false
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || []
  },
  security: {
    forceSSL: true,
    strictTransportSecurity: true
  }
};
```

## Error Handling

### Configuration Errors
```javascript
export class ConfigurationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ConfigurationError';
    this.details = details;
  }
}

export function handleConfigurationError(error) {
  console.error('Configuration Error:', error.message);
  
  if (error.details && error.details.length > 0) {
    console.error('Details:');
    error.details.forEach(detail => console.error(`  - ${detail}`));
  }
  
  process.exit(1);
}
```

### Provider Initialization Errors
```javascript
export async function safeProviderInitialization(providerName, initFunction) {
  try {
    const provider = await initFunction();
    console.log(`✅ ${providerName} provider initialized successfully`);
    return provider;
  } catch (error) {
    console.error(`❌ Failed to initialize ${providerName} provider:`, error.message);
    
    // Check if provider is critical
    if (CRITICAL_PROVIDERS.includes(providerName)) {
      throw error;
    }
    
    // Return null for non-critical providers
    console.warn(`⚠️  Continuing without ${providerName} provider`);
    return null;
  }
}
```

## Testing Configuration

### Test Environment Setup
```javascript
export const TEST_CONFIG = {
  database: {
    database: 'cogito_test',
    ssl: false,
    pool: { min: 1, max: 5 }
  },
  session: {
    secret: 'test-session-secret-32-characters-long',
    cookie: { secure: false }
  },
  llm: {
    provider: 'mock',
    apiKey: 'test-key'
  }
};
```

### Configuration Testing Utilities
```javascript
export function createTestConfiguration(overrides = {}) {
  return {
    ...TEST_CONFIG,
    ...overrides
  };
}

export function validateTestConfiguration(config) {
  // Ensure test configuration is safe and isolated
  if (!config.database.database.includes('test')) {
    throw new Error('Test database must include "test" in name');
  }
  
  if (config.database.database === process.env.DB_NAME) {
    throw new Error('Test database cannot be same as production database');
  }
}
```