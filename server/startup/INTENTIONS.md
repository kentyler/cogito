# Server Startup System

## Purpose
Server initialization and configuration system that handles Express application setup, middleware configuration, and route mounting. Provides centralized server startup orchestration with organized route registration and proper initialization order.

## Core Startup Components

### `server-initializer.js`
**Purpose**: Express application creation and route mounting orchestration
- Creates and configures Express application instance
- Handles middleware setup and initialization order
- Manages comprehensive route mounting with proper prefixes
- Provides centralized server startup configuration

```javascript
export function createExpressApp() {
  // 1. Create Express application instance
  const app = express();
  
  // 2. Setup middleware stack in proper order
  setupMiddleware(app);
  
  // 3. Return configured Express app
  return app;
}

export function mountRoutes(app) {
  // Authentication routes
  app.use('/', authRoutes);                    // Root auth endpoints
  app.use('/auth', authSessionRoutes);         // Session management
  app.use('/auth', authOAuthRoutes);          // OAuth providers
  
  // Client management routes
  app.use('/client-management', clientManagementRoutes);
  
  // Meeting routes  
  app.use('/meetings', meetingsCrudRoutes);    // CRUD operations
  app.use('/meetings', meetingsAdditionalRoutes); // Additional operations
  
  // Settings routes
  app.use('/settings', settingsRoutes);
  
  // Core functionality routes
  app.use('/', chatInterfaceRoutes);           // Chat interface
  app.use('/conversations', conversationRoutes); // Conversation processing
  app.use('/search', searchRoutes);            // Search functionality
  
  // Admin routes
  app.use('/admin', adminClientManagementRoutes); // Client admin
  app.use('/admin', adminUserManagementRoutes);   // User admin
  
  // Integration routes
  app.use('/api', extensionApiRoutes);         // Extension API
  app.use('/webhook', webhookChatRoutes);      // Webhook processing
  app.use('/browser-capture', browserCaptureRoutes); // Browser integration
  
  // Bot management routes
  app.use('/bots', botsManagementRoutes);      // Bot CRUD
  app.use('/bots', botsCreateRoutes);          // Bot creation
  
  // File operation routes
  app.use('/upload', uploadFilesRoutes);       // File uploads
  
  // Summary and reporting routes
  app.use('/summaries', summaryHandlersRoutes); // Summary generation
  app.use('/meeting-summaries', meetingSummariesRoutes); // Meeting summaries
  
  // Invitation system routes
  app.use('/invitations', invitationRoutes);    // Invitation management
  app.use('/invite', invitationGatewayRoutes);  // Invitation gateway
}
```

## Server Initialization Pipeline

### Application Bootstrap Process
```javascript
export class ServerBootstrap {
  constructor(configuration) {
    this.config = configuration;
    this.app = null;
    this.dbAgent = null;
    this.initialized = false;
  }
  
  async initializeServer() {
    try {
      // 1. Initialize database connections
      await this.initializeDatabase();
      
      // 2. Create and configure Express app
      this.app = this.createApplicationInstance();
      
      // 3. Setup middleware stack
      await this.setupMiddleware();
      
      // 4. Mount all application routes
      this.mountApplicationRoutes();
      
      // 5. Setup error handling
      this.setupErrorHandling();
      
      // 6. Perform health checks
      await this.performHealthChecks();
      
      // 7. Mark server as initialized
      this.initialized = true;
      
      return this.app;
    } catch (error) {
      console.error('Server initialization failed:', error);
      throw new Error(`Server bootstrap failed: ${error.message}`);
    }
  }
  
  async initializeDatabase() {
    // 1. Create DatabaseAgent instance
    this.dbAgent = new DatabaseAgent();
    
    // 2. Establish database connection
    await this.dbAgent.connect();
    
    // 3. Verify database schema
    await this.dbAgent.verifySchemaIntegrity();
    
    // 4. Run any pending migrations
    await this.runPendingMigrations();
    
    console.log('Database initialization complete');
  }
  
  createApplicationInstance() {
    // 1. Create Express app using centralized function
    const app = createExpressApp();
    
    // 2. Attach database agent to app context
    app.locals.dbAgent = this.dbAgent;
    
    // 3. Set application configuration
    app.locals.config = this.config;
    
    return app;
  }
  
  setupMiddleware() {
    // 1. Security middleware (first)
    this.app.use(helmet({
      contentSecurityPolicy: this.config.security.csp,
      crossOriginEmbedderPolicy: false
    }));
    
    // 2. CORS configuration
    this.app.use(cors(this.config.cors));
    
    // 3. Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // 4. Session management
    this.setupSessionMiddleware();
    
    // 5. Authentication middleware
    this.setupAuthenticationMiddleware();
    
    // 6. Rate limiting
    if (this.config.rateLimiting.enabled) {
      this.setupRateLimiting();
    }
  }
  
  mountApplicationRoutes() {
    // 1. Use centralized route mounting
    mountRoutes(this.app);
    
    // 2. Setup static file serving
    this.setupStaticFileServing();
    
    // 3. Setup API documentation routes
    if (this.config.apiDocs.enabled) {
      this.setupApiDocumentation();
    }
  }
}
```

### Route Organization Strategy
```javascript
export class RouteOrganizer {
  static getRouteConfiguration() {
    return {
      // Authentication and session routes
      auth: {
        routes: [
          { path: '/', handler: 'authRoutes', priority: 1 },
          { path: '/auth', handler: 'authSessionRoutes', priority: 2 },
          { path: '/auth', handler: 'authOAuthRoutes', priority: 3 }
        ],
        middleware: ['csrf', 'rateLimit'],
        description: 'User authentication and session management'
      },
      
      // Client management routes
      clientManagement: {
        routes: [
          { path: '/client-management', handler: 'clientManagementRoutes', priority: 4 }
        ],
        middleware: ['requireAuth', 'clientValidation'],
        description: 'Client selection and switching'
      },
      
      // Core application routes
      core: {
        routes: [
          { path: '/', handler: 'chatInterfaceRoutes', priority: 5 },
          { path: '/conversations', handler: 'conversationRoutes', priority: 6 },
          { path: '/search', handler: 'searchRoutes', priority: 7 }
        ],
        middleware: ['requireAuth', 'requireClient'],
        description: 'Core application functionality'
      },
      
      // Administrative routes
      admin: {
        routes: [
          { path: '/admin', handler: 'adminClientManagementRoutes', priority: 8 },
          { path: '/admin', handler: 'adminUserManagementRoutes', priority: 9 }
        ],
        middleware: ['requireAuth', 'requireAdmin'],
        description: 'Administrative functionality'
      },
      
      // Integration routes
      integrations: {
        routes: [
          { path: '/api', handler: 'extensionApiRoutes', priority: 10 },
          { path: '/webhook', handler: 'webhookChatRoutes', priority: 11 },
          { path: '/browser-capture', handler: 'browserCaptureRoutes', priority: 12 }
        ],
        middleware: ['apiAuth', 'webhookValidation'],
        description: 'External integrations and APIs'
      }
    };
  }
}
```

## Configuration Management

### Server Configuration Structure
```javascript
{
  server: {
    port: number,
    host: string,
    environment: 'development' | 'production' | 'test'
  },
  database: {
    connectionString: string,
    pool: {
      min: number,
      max: number,
      acquireTimeoutMillis: number,
      idleTimeoutMillis: number
    }
  },
  security: {
    sessionSecret: string,
    csrfProtection: boolean,
    csp: object,
    rateLimiting: {
      enabled: boolean,
      windowMs: number,
      maxRequests: number
    }
  },
  cors: {
    origin: string | [string],
    credentials: boolean,
    methods: [string]
  },
  oauth: {
    google: {
      clientId: string,
      clientSecret: string,
      callbackURL: string
    }
  },
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error',
    format: 'json' | 'text',
    destinations: [string]
  }
}
```

### Environment-Specific Initialization
```javascript
export class EnvironmentConfigManager {
  static getConfiguration(environment) {
    const baseConfig = this.getBaseConfiguration();
    
    switch (environment) {
      case 'development':
        return {
          ...baseConfig,
          ...this.getDevelopmentOverrides()
        };
        
      case 'production':
        return {
          ...baseConfig,
          ...this.getProductionOverrides()
        };
        
      case 'test':
        return {
          ...baseConfig,
          ...this.getTestOverrides()
        };
        
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }
  }
  
  static getDevelopmentOverrides() {
    return {
      logging: { level: 'debug', format: 'text' },
      security: { 
        csrfProtection: false,
        rateLimiting: { enabled: false }
      },
      cors: { origin: 'http://localhost:3000' }
    };
  }
  
  static getProductionOverrides() {
    return {
      logging: { level: 'info', format: 'json' },
      security: {
        csrfProtection: true,
        rateLimiting: { enabled: true, maxRequests: 100 }
      },
      cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') }
    };
  }
}
```

## Health Checks and Monitoring

### Server Health Validation
```javascript
export class ServerHealthChecker {
  constructor(app, dbAgent, config) {
    this.app = app;
    this.dbAgent = dbAgent;
    this.config = config;
  }
  
  async performHealthChecks() {
    const healthChecks = [
      this.checkDatabaseConnectivity(),
      this.checkExternalServiceConnectivity(),
      this.checkMemoryUsage(),
      this.checkDiskSpace(),
      this.validateConfiguration()
    ];
    
    const results = await Promise.allSettled(healthChecks);
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      console.warn('Health check failures:', failures);
      // Don't fail startup for non-critical health checks
    }
    
    return this.generateHealthReport(results);
  }
  
  async checkDatabaseConnectivity() {
    try {
      await this.dbAgent.connector.query('SELECT 1');
      return { status: 'healthy', service: 'database' };
    } catch (error) {
      throw new Error(`Database connectivity check failed: ${error.message}`);
    }
  }
  
  async checkExternalServiceConnectivity() {
    // 1. Check OAuth provider connectivity
    // 2. Check email service connectivity
    // 3. Check any other external dependencies
    const services = ['oauth', 'email', 'storage'];
    const checks = services.map(service => this.checkService(service));
    
    const results = await Promise.allSettled(checks);
    return results.map((result, index) => ({
      service: services[index],
      status: result.status === 'fulfilled' ? 'healthy' : 'degraded',
      error: result.reason?.message
    }));
  }
}
```

### Graceful Shutdown Handling
```javascript
export class GracefulShutdownManager {
  constructor(server, dbAgent) {
    this.server = server;
    this.dbAgent = dbAgent;
    this.shutdownInProgress = false;
  }
  
  setupShutdownHandlers() {
    // 1. Handle SIGTERM (Docker/Kubernetes)
    process.on('SIGTERM', () => this.initiateShutdown('SIGTERM'));
    
    // 2. Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => this.initiateShutdown('SIGINT'));
    
    // 3. Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.initiateShutdown('UNCAUGHT_EXCEPTION');
    });
  }
  
  async initiateShutdown(signal) {
    if (this.shutdownInProgress) {
      console.log('Shutdown already in progress, forcing exit');
      process.exit(1);
    }
    
    this.shutdownInProgress = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);
    
    try {
      // 1. Stop accepting new connections
      this.server.close((error) => {
        if (error) {
          console.error('Error closing server:', error);
        } else {
          console.log('Server closed successfully');
        }
      });
      
      // 2. Wait for existing connections to complete (with timeout)
      await this.waitForConnectionsDrain(30000); // 30 seconds
      
      // 3. Close database connections
      if (this.dbAgent) {
        await this.dbAgent.disconnect();
        console.log('Database connections closed');
      }
      
      // 4. Perform final cleanup
      await this.performFinalCleanup();
      
      console.log('Graceful shutdown completed');
      process.exit(0);
      
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}
```

## Error Handling

### Startup Error Recovery
```javascript
export class StartupErrorRecovery {
  static handleInitializationError(error, context) {
    console.error(`Startup error in ${context}:`, error);
    
    // 1. Classify error type
    const errorType = this.classifyStartupError(error);
    
    // 2. Determine if error is recoverable
    const recoveryStrategy = this.getRecoveryStrategy(errorType);
    
    // 3. Apply recovery strategy or fail gracefully
    if (recoveryStrategy.recoverable) {
      return this.attemptRecovery(recoveryStrategy, context);
    } else {
      this.logFatalError(error, context);
      process.exit(1);
    }
  }
  
  static classifyStartupError(error) {
    if (error.message.includes('database') || error.code === 'ECONNREFUSED') {
      return 'DATABASE_CONNECTION';
    }
    
    if (error.message.includes('port') || error.code === 'EADDRINUSE') {
      return 'PORT_CONFLICT';
    }
    
    if (error.message.includes('configuration') || error.message.includes('config')) {
      return 'CONFIGURATION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }
}
```

## Testing Strategies

### Server Initialization Testing
```javascript
describe('Server Initialization', () => {
  let server;
  let dbAgent;
  
  beforeEach(async () => {
    // Setup test database and configuration
    dbAgent = new DatabaseAgent(testConfig.database);
    await dbAgent.connect();
  });
  
  afterEach(async () => {
    if (server) {
      await server.close();
    }
    await dbAgent.disconnect();
  });
  
  test('initializes server with all routes', async () => {
    const bootstrap = new ServerBootstrap(testConfig);
    const app = await bootstrap.initializeServer();
    
    expect(app).toBeDefined();
    expect(bootstrap.initialized).toBe(true);
  });
  
  test('handles database connection failure gracefully', async () => {
    const invalidConfig = { ...testConfig, database: { connectionString: 'invalid' } };
    const bootstrap = new ServerBootstrap(invalidConfig);
    
    await expect(bootstrap.initializeServer()).rejects.toThrow('Database connectivity');
  });
  
  test('mounts all routes correctly', () => {
    const app = express();
    const routesBefore = app._router ? app._router.stack.length : 0;
    
    mountRoutes(app);
    
    const routesAfter = app._router.stack.length;
    expect(routesAfter).toBeGreaterThan(routesBefore);
  });
});
```

### Integration Testing
```javascript
describe('Server Integration', () => {
  test('complete server startup and health check', async () => {
    const server = await startTestServer();
    
    const healthResponse = await request(server)
      .get('/health')
      .expect(200);
    
    expect(healthResponse.body.status).toBe('healthy');
    expect(healthResponse.body.services).toContain('database');
  });
  
  test('graceful shutdown works correctly', async () => {
    const server = await startTestServer();
    const shutdownManager = new GracefulShutdownManager(server, testDbAgent);
    
    // Simulate shutdown signal
    await shutdownManager.initiateShutdown('TEST');
    
    // Verify server closed and database disconnected
    expect(server.listening).toBe(false);
  });
});
```