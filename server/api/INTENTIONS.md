# API Response System

## Purpose
Standardized API response utilities that provide consistent response formats across all server endpoints. Ensures uniform error handling, success responses, and HTTP status code management throughout the application.

## Core Response Components

### `api-responses.js`
**Purpose**: Standardized response helpers for consistent API communication
- Provides unified response format patterns across all endpoints
- Handles error responses with consistent structure and status codes
- Manages success responses with optional metadata and pagination
- Implements common HTTP response patterns (400, 401, 403, 404, 500, etc.)

```javascript
export const ApiResponses = {
  error(res, statusCode, message, details = null) {
    // 1. Structure error response with consistent format
    // 2. Include optional details for debugging/client handling
    // 3. Set appropriate HTTP status code
    // 4. Return JSON response with error information
    const response = { error: message };
    if (details) {
      response.details = details;
    }
    return res.status(statusCode).json(response);
  },
  
  success(res, data, statusCode = 200) {
    // 1. Send data directly as JSON response
    // 2. Set HTTP status code (defaults to 200 OK)
    // 3. Return response for method chaining
    return res.status(statusCode).json(data);
  },
  
  successWithMeta(res, data, meta = null, statusCode = 200) {
    // 1. Wrap data in structured response format
    // 2. Include optional metadata (pagination, counts, etc.)
    // 3. Set appropriate HTTP status code
    // 4. Return structured JSON with data and meta fields
    const response = { data };
    if (meta) {
      response.meta = meta;
    }
    return res.status(statusCode).json(response);
  },
  
  successMessage(res, message = 'Success', details = null) {
    // 1. Create success confirmation response
    // 2. Include success flag and message
    // 3. Add optional details to response
    // 4. Return confirmation JSON response
    const response = { success: true, message };
    if (details) {
      Object.assign(response, details);
    }
    return res.json(response);
  },
  
  // Common HTTP error responses with appropriate status codes
  badRequest(res, message = 'Bad request', details = null) {
    return this.error(res, 400, message, details);
  },
  
  unauthorized(res, message = 'Authentication required') {
    return this.error(res, 401, message);
  },
  
  forbidden(res, message = 'Access denied') {
    return this.error(res, 403, message);
  },
  
  notFound(res, message = 'Resource not found') {
    return this.error(res, 404, message);
  },
  
  internalError(res, message = 'Internal server error', details = null) {
    return this.error(res, 500, message, details);
  },
  
  databaseError(res, message = 'Database connection failed') {
    return this.internalError(res, message);
  }
};
```

## Response Format Standards

### Error Response Format
```javascript
{
  error: string,        // Human-readable error message
  details?: object      // Optional additional error information
}
```

### Success Response Formats
```javascript
// Simple data response
{
  // Direct data structure
}

// Data with metadata
{
  data: any,           // Response payload
  meta?: {            // Optional metadata
    pagination: object,
    totalCount: number,
    filters: object
  }
}

// Success confirmation
{
  success: boolean,    // Always true for success confirmations
  message: string,     // Success message
  ...details          // Additional response fields
}
```

## Integration Patterns

### Route Handler Usage
```javascript
export async function exampleRoute(req, res) {
  try {
    // Validation
    if (!req.body.required_field) {
      return ApiResponses.badRequest(res, 'Missing required field', {
        field: 'required_field',
        received: Object.keys(req.body)
      });
    }
    
    // Authentication check
    if (!req.user) {
      return ApiResponses.unauthorized(res);
    }
    
    // Authorization check
    if (!hasPermission(req.user, 'action')) {
      return ApiResponses.forbidden(res, 'Insufficient permissions for action');
    }
    
    // Business logic
    const result = await performOperation(req.body);
    
    // Success response
    return ApiResponses.success(res, result, 201);
    
  } catch (error) {
    console.error('Route error:', error);
    
    // Database errors
    if (error.code === 'CONNECTION_FAILED') {
      return ApiResponses.databaseError(res);
    }
    
    // Validation errors
    if (error.type === 'VALIDATION_ERROR') {
      return ApiResponses.badRequest(res, error.message, error.details);
    }
    
    // Generic server error
    return ApiResponses.internalError(res, 'Operation failed', {
      errorId: generateErrorId(),
      timestamp: new Date().toISOString()
    });
  }
}
```

### Database Agent Integration
```javascript
export class ServiceClass {
  async performDatabaseOperation(data) {
    try {
      const dbAgent = new DatabaseAgent();
      await dbAgent.connect();
      
      const result = await dbAgent.someOperations.performAction(data);
      return result;
      
    } catch (error) {
      // Let route handlers manage ApiResponses
      throw error;
    }
  }
}
```

## Error Handling Patterns

### Client Error Responses (4xx)
```javascript
// 400 Bad Request - Invalid input data
ApiResponses.badRequest(res, 'Invalid email format', {
  field: 'email',
  value: req.body.email,
  expected: 'Valid email address'
});

// 401 Unauthorized - Authentication required
ApiResponses.unauthorized(res, 'Login required to access this resource');

// 403 Forbidden - Insufficient permissions
ApiResponses.forbidden(res, 'Admin access required');

// 404 Not Found - Resource doesn't exist
ApiResponses.notFound(res, 'Meeting not found', {
  meetingId: req.params.meetingId,
  userId: req.user.id
});
```

### Server Error Responses (5xx)
```javascript
// 500 Internal Server Error - Generic server failure
ApiResponses.internalError(res, 'Failed to process request', {
  errorId: 'ERR-' + Date.now(),
  supportContact: 'support@cogito.com'
});

// Database connection failures
ApiResponses.databaseError(res, 'Unable to connect to database');
```

## Success Response Patterns

### Simple Data Response
```javascript
// Return data directly
const meetings = await dbAgent.meetingOperations.getMeetingsByUser(userId);
return ApiResponses.success(res, meetings);
```

### Data with Pagination
```javascript
const { data, totalCount, hasMore } = await dbAgent.getPagedResults(query, page, limit);
return ApiResponses.successWithMeta(res, data, {
  pagination: {
    page,
    limit,
    totalCount,
    hasMore,
    totalPages: Math.ceil(totalCount / limit)
  }
});
```

### Operation Confirmation
```javascript
await dbAgent.meetingOperations.deleteMeeting(meetingId);
return ApiResponses.successMessage(res, 'Meeting deleted successfully', {
  meetingId,
  deletedAt: new Date().toISOString()
});
```

## Status Code Guidelines

### Success Codes
- `200 OK` - Standard successful response (default)
- `201 Created` - Resource successfully created
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Successful deletion or update with no response body

### Client Error Codes
- `400 Bad Request` - Invalid input data or malformed request
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - Authenticated but insufficient permissions
- `404 Not Found` - Requested resource doesn't exist
- `409 Conflict` - Resource conflict (duplicate creation, etc.)

### Server Error Codes
- `500 Internal Server Error` - Generic server failure
- `502 Bad Gateway` - External service failure
- `503 Service Unavailable` - Service temporarily unavailable

## Frontend Integration

### JavaScript Client Usage
```javascript
// Handle API responses consistently
async function callAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new APIError(data.error, data.details, response.status);
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Usage with error handling
try {
  const meetings = await callAPI('/api/meetings');
  displayMeetings(meetings);
} catch (error) {
  if (error.status === 401) {
    redirectToLogin();
  } else if (error.status === 403) {
    showAccessDeniedMessage();
  } else {
    showErrorMessage(error.message);
  }
}
```

### ClojureScript Integration
```clojure
(defn handle-api-response [response]
  (cond
    (= 200 (:status response)) 
    {:success true :data (:body response)}
    
    (= 400 (:status response))
    {:error true :type :validation :message (get-in response [:body :error])}
    
    (= 401 (:status response))
    {:error true :type :auth :message "Authentication required"}
    
    (= 403 (:status response))
    {:error true :type :permission :message "Access denied"}
    
    (= 404 (:status response))
    {:error true :type :not-found :message "Resource not found"}
    
    :else
    {:error true :type :server :message "Server error"}))
```

## Logging Integration

### Request Logging
```javascript
export function logAPIRequest(req, res, responseData, statusCode) {
  const logData = {
    method: req.method,
    path: req.path,
    statusCode,
    userId: req.user?.id,
    clientId: req.user?.client_id,
    duration: Date.now() - req.startTime,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  
  if (statusCode >= 400) {
    console.error('API Error Response:', logData, responseData);
  } else {
    console.info('API Success Response:', logData);
  }
}
```

## Testing Strategies

### Unit Testing
```javascript
describe('ApiResponses', () => {
  let mockRes;
  
  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });
  
  test('error response includes message and status', () => {
    ApiResponses.error(mockRes, 400, 'Test error', { field: 'test' });
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Test error',
      details: { field: 'test' }
    });
  });
  
  test('success response formats data correctly', () => {
    const testData = { id: 1, name: 'Test' };
    ApiResponses.success(mockRes, testData, 201);
    
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(testData);
  });
});
```

### Integration Testing
```javascript
describe('API Response Integration', () => {
  test('route uses consistent error format', async () => {
    const response = await request(app)
      .post('/api/meetings')
      .send({})
      .expect(400);
    
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Missing required field');
  });
  
  test('route returns data in standard format', async () => {
    const response = await request(app)
      .get('/api/meetings')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

## Security Considerations

### Information Disclosure
- Error messages should be informative but not leak sensitive system information
- Stack traces should never be sent to clients in production
- Internal error details should be logged but not exposed

### Input Validation
- All error responses should sanitize input data before including in details
- Prevent XSS through JSON responses
- Validate status codes to prevent injection

### Rate Limiting Integration
```javascript
export function rateLimitExceeded(res, retryAfter = 60) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    details: {
      retryAfter: retryAfter,
      retryAfterDate: new Date(Date.now() + retryAfter * 1000).toISOString()
    }
  });
}
```