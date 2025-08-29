# Middleware System

## Purpose
Express.js middleware functions that provide cross-cutting concerns like authentication, authorization, database connectivity, and request processing. These middleware functions are applied across routes to ensure consistent security and operational patterns.

## Core Middleware Components

### `admin-auth.js`
**Purpose**: Admin authentication and database connectivity middleware
- Provides admin authorization checks for restricted endpoints
- Ensures database connectivity before route processing
- Handles session validation and user permission verification
- Implements debug logging for authentication troubleshooting

```javascript
export function requireAdmin(req, res, next) {
  // 1. Define authorized admin user IDs (handles both string and number formats)
  const adminUserIds = [1, 7, '1', '7']; // ken@8thfold.com and ianpalonis@gmail.com
  
  // 2. Log session details for debugging admin access
  console.log('Admin check - Full session:', JSON.stringify(req.session));
  console.log('Admin check - Session user:', req.session?.user);
  
  // 3. Extract user ID from session
  const userId = req.session?.user?.user_id;
  
  // 4. Handle both string and number user ID formats
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  const userIdStr = String(userId);
  
  // 5. Log detailed admin check information
  console.log('Admin check - User ID:', userId, 'Type:', typeof userId, 
             'Parsed:', userIdNum, 'Is Admin:', 
             adminUserIds.includes(userId) || adminUserIds.includes(userIdNum) || adminUserIds.includes(userIdStr));
  
  // 6. Validate user has admin permissions (check all format variations)
  if (!userId || (!adminUserIds.includes(userId) && 
                  !adminUserIds.includes(userIdNum) && 
                  !adminUserIds.includes(userIdStr))) {
    return res.status(403).json({ 
      error: 'Admin access required. This function is restricted to authorized administrators.',
      debug: { 
        userId, 
        userIdType: typeof userId, 
        parsedId: userIdNum, 
        session: req.session 
      }
    });
  }
  
  // 7. Allow request to proceed if admin validation passes
  next();
}

export function ensureDbConnection(dbAgent) {
  return async (req, res, next) => {
    try {
      // 1. Check if database connection pool exists
      if (!dbAgent.connector.pool) {
        // 2. Establish database connection if not present
        await dbAgent.connect();
      }
      
      // 3. Proceed to next middleware/route handler
      next();
    } catch (error) {
      // 4. Handle database connection failures
      console.error('Database connection error:', error);
      res.status(500).json({ error: 'Database connection failed' });
    }
  };
}
```

## Middleware Integration Patterns

### Admin Route Protection
```javascript
export class AdminRouteProtector {
  static protectAdminRoutes(router, dbAgent) {
    // 1. Apply admin authentication to all admin routes
    router.use('/admin/*', requireAdmin);
    
    // 2. Ensure database connectivity for admin operations
    router.use('/admin/*', ensureDbConnection(dbAgent));
    
    // 3. Add request logging for admin operations
    router.use('/admin/*', this.logAdminRequest);
    
    return router;
  }
  
  static logAdminRequest(req, res, next) {
    // 1. Log admin operation details
    console.log(`Admin operation: ${req.method} ${req.path}`, {
      user: req.session?.user?.user_id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    next();
  }
}
```

### Authentication Middleware Chain
```javascript
export class AuthenticationMiddleware {
  static requireAuthentication(req, res, next) {
    // 1. Check if user session exists
    if (!req.session?.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirect: '/login'
      });
    }
    
    // 2. Validate session is still active
    if (this.isSessionExpired(req.session)) {
      return res.status(401).json({
        error: 'Session expired',
        redirect: '/login'
      });
    }
    
    // 3. Attach user context to request
    req.user = req.session.user;
    next();
  }
  
  static requireClientSelection(req, res, next) {
    // 1. Ensure user has selected a client
    if (!req.session?.client_id) {
      return res.status(400).json({
        error: 'Client selection required',
        redirect: '/client-selection'
      });
    }
    
    // 2. Attach client context to request
    req.clientId = req.session.client_id;
    next();
  }
  
  static isSessionExpired(session) {
    // 1. Check session timestamp against expiration policy
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    
    return sessionAge > maxAge;
  }
}
```

### Database Middleware Patterns
```javascript
export class DatabaseMiddleware {
  static attachDatabaseAgent(dbAgent) {
    return (req, res, next) => {
      // 1. Attach database agent to request object
      req.dbAgent = dbAgent;
      next();
    };
  }
  
  static ensureConnection(req, res, next) {
    return async (req, res, next) => {
      try {
        // 1. Verify database agent exists
        if (!req.dbAgent) {
          throw new Error('Database agent not available');
        }
        
        // 2. Ensure connection is established
        await req.dbAgent.ensureConnected();
        
        next();
      } catch (error) {
        console.error('Database middleware error:', error);
        res.status(503).json({ 
          error: 'Database service unavailable',
          details: 'Please try again later'
        });
      }
    };
  }
  
  static beginTransaction(req, res, next) {
    return async (req, res, next) => {
      try {
        // 1. Begin database transaction
        req.transaction = await req.dbAgent.connector.beginTransaction();
        
        // 2. Add transaction cleanup handlers
        res.on('finish', () => {
          if (req.transaction && !req.transaction.completed) {
            req.transaction.rollback().catch(console.error);
          }
        });
        
        next();
      } catch (error) {
        console.error('Transaction middleware error:', error);
        res.status(500).json({ error: 'Transaction initialization failed' });
      }
    };
  }
}
```

## Request Processing Middleware

### Request Validation Middleware
```javascript
export class ValidationMiddleware {
  static validateRequestBody(schema) {
    return (req, res, next) => {
      try {
        // 1. Validate request body against schema
        const validated = schema.parse(req.body);
        
        // 2. Replace request body with validated data
        req.body = validated;
        
        next();
      } catch (error) {
        // 3. Handle validation errors
        return res.status(400).json({
          error: 'Request validation failed',
          details: error.errors || error.message
        });
      }
    };
  }
  
  static sanitizeInput(req, res, next) {
    // 1. Sanitize string inputs
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }
    
    // 2. Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }
    
    next();
  }
  
  static sanitizeObject(obj) {
    // 1. Recursively sanitize object properties
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // 2. Apply string sanitization
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // 3. Recursively sanitize nested objects
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}
```

### Error Handling Middleware
```javascript
export class ErrorHandlingMiddleware {
  static globalErrorHandler(err, req, res, next) {
    // 1. Log error with context
    console.error('Global error handler:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      user: req.user?.user_id,
      timestamp: new Date().toISOString()
    });
    
    // 2. Handle different error types
    if (err.type === 'VALIDATION_ERROR') {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.details
      });
    }
    
    if (err.type === 'AUTHORIZATION_ERROR') {
      return res.status(403).json({
        error: 'Access denied',
        message: err.message
      });
    }
    
    if (err.type === 'DATABASE_ERROR') {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Please try again later'
      });
    }
    
    // 3. Default to internal server error
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
  
  static notFoundHandler(req, res) {
    // 1. Handle 404 for unmatched routes
    res.status(404).json({
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`,
      availableRoutes: this.getAvailableRoutes()
    });
  }
}
```

## Security Middleware

### Security Headers Middleware
```javascript
export class SecurityMiddleware {
  static setSecurityHeaders(req, res, next) {
    // 1. Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // 2. Set CSRF token if not present
    if (!req.session.csrfToken) {
      req.session.csrfToken = this.generateCSRFToken();
    }
    
    next();
  }
  
  static validateCSRF(req, res, next) {
    // 1. Skip CSRF validation for GET requests
    if (req.method === 'GET') {
      return next();
    }
    
    // 2. Check CSRF token in request
    const token = req.headers['x-csrf-token'] || req.body.csrfToken;
    
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({
        error: 'CSRF token validation failed'
      });
    }
    
    next();
  }
}
```

### Rate Limiting Middleware
```javascript
export class RateLimitingMiddleware {
  constructor() {
    this.requestCounts = new Map();
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.maxRequests = 100;
  }
  
  rateLimit(req, res, next) {
    // 1. Generate client identifier
    const clientId = this.getClientId(req);
    
    // 2. Get current request count
    const now = Date.now();
    const requestData = this.requestCounts.get(clientId) || { count: 0, resetTime: now + this.windowMs };
    
    // 3. Reset count if window expired
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + this.windowMs;
    }
    
    // 4. Check rate limit
    if (requestData.count >= this.maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
    
    // 5. Increment request count
    requestData.count++;
    this.requestCounts.set(clientId, requestData);
    
    // 6. Add rate limit headers
    res.setHeader('X-RateLimit-Limit', this.maxRequests);
    res.setHeader('X-RateLimit-Remaining', this.maxRequests - requestData.count);
    res.setHeader('X-RateLimit-Reset', requestData.resetTime);
    
    next();
  }
}
```

## Application Integration

### Middleware Stack Configuration
```javascript
export class MiddlewareStack {
  static configureGlobalMiddleware(app, dbAgent) {
    // 1. Security middleware (first)
    app.use(SecurityMiddleware.setSecurityHeaders);
    
    // 2. Request processing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // 3. Session and authentication
    app.use(session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production' }
    }));
    
    // 4. Database middleware
    app.use(DatabaseMiddleware.attachDatabaseAgent(dbAgent));
    
    // 5. Rate limiting
    const rateLimiter = new RateLimitingMiddleware();
    app.use(rateLimiter.rateLimit.bind(rateLimiter));
    
    // 6. Input validation and sanitization
    app.use(ValidationMiddleware.sanitizeInput);
  }
  
  static configureErrorHandling(app) {
    // 1. 404 handler (before error handler)
    app.use(ErrorHandlingMiddleware.notFoundHandler);
    
    // 2. Global error handler (last)
    app.use(ErrorHandlingMiddleware.globalErrorHandler);
  }
}
```

## Testing Strategies

### Middleware Unit Testing
```javascript
describe('Admin Authentication Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = { session: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  test('allows admin user access', () => {
    req.session.user = { user_id: 1 };
    
    requireAdmin(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
  
  test('blocks non-admin user', () => {
    req.session.user = { user_id: 999 };
    
    requireAdmin(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### Integration Testing
```javascript
describe('Middleware Integration', () => {
  test('middleware stack processes requests correctly', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    // Verify security headers
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
  
  test('database middleware provides connection', async () => {
    await request(app)
      .get('/api/meetings')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
  });
});
```