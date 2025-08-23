# API Standards and Patterns

## Overview

This document establishes consistent patterns for HTTP API responses across all route handlers in the Cogito application.

## Response Standardization

### ApiResponses Helper

All routes should use the `ApiResponses` helper located at `server/lib/api-responses.js`:

```javascript
import { ApiResponses } from '../lib/api-responses.js';
```

### Standard Response Methods

#### Error Responses
```javascript
// Generic error with custom status code
ApiResponses.error(res, statusCode, message, details);

// Common error shortcuts
ApiResponses.badRequest(res, message);        // 400
ApiResponses.unauthorized(res, message);      // 401  
ApiResponses.forbidden(res, message);         // 403
ApiResponses.notFound(res, message);          // 404
ApiResponses.internalError(res, message);     // 500
ApiResponses.databaseError(res, message);     // 500 with DB context
```

#### Success Responses
```javascript
// Simple data response
ApiResponses.success(res, data, statusCode);

// Data with metadata (pagination, counts, etc.)
ApiResponses.successWithMeta(res, data, meta, statusCode);

// Success confirmation with message
ApiResponses.successMessage(res, message, details);
```

### Migration Pattern

#### Before (Inconsistent)
```javascript
// Various inconsistent patterns found in codebase:
res.status(400).json({ error: 'Bad request' });
res.status(401).json({ error: 'Authentication required' });
res.json({ success: true, data: results });
res.json(results);
return res.status(500).json({ error: 'Internal error' });
```

#### After (Standardized)
```javascript
// Consistent patterns using ApiResponses:
return ApiResponses.badRequest(res, 'Bad request');
return ApiResponses.unauthorized(res, 'Authentication required');
return ApiResponses.successMessage(res, 'Operation completed', { data: results });
return ApiResponses.success(res, results);
return ApiResponses.internalError(res, 'Internal error');
```

## Conversion Status

### Completed Routes
- ✅ `server/routes/extension-api.js`
- ✅ `server/routes/meetings/crud.js`
- ✅ `server/routes/search.js`

### Pending Routes
The following routes need conversion (as of latest analysis):

**High Priority (Many Response Points)**
- `server/routes/client-management/selection.js` (13 responses)
- `server/routes/summary-routes.js` (16 responses)
- `server/routes/auth/index.js` (15 responses)
- `server/routes/admin-user-management.js` (15 responses)
- `server/routes/upload-files.js` (11 responses)

**Medium Priority**
- `server/routes/meetings/additional.js` (10 responses)
- `server/routes/bots-management.js` (10 responses)
- `server/routes/invitations.js` (13 responses)
- `server/routes/settings/llms.js` (10 responses)

**Lower Priority**
- All remaining route files with fewer response points

### Conversion Tools

Use the analysis script to identify remaining work:
```bash
node scripts/convert-routes-to-api-responses.js
```

## Best Practices

### 1. Always Return Responses
```javascript
// ✅ Good - explicit return
return ApiResponses.success(res, data);

// ❌ Avoid - missing return can cause double responses
ApiResponses.success(res, data);
// More code here might accidentally send another response
```

### 2. Consistent Error Messages
```javascript
// ✅ Good - descriptive and user-friendly
return ApiResponses.badRequest(res, 'Meeting URL is required');

// ❌ Avoid - generic or developer-focused
return ApiResponses.badRequest(res, 'Invalid input');
```

### 3. Use Appropriate HTTP Status Codes
- **400 Bad Request**: Client error in request format/content
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Valid auth but insufficient permissions  
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Server-side errors

### 4. Include Helpful Details When Appropriate
```javascript
// For debugging-friendly responses
return ApiResponses.internalError(res, 'Database query failed', {
  query: sanitizedQuery,
  timestamp: new Date().toISOString()
});
```

## Response Format Standards

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "details": {
    "optional": "additional context"
  }
}
```

### Success Response Formats
```json
// Simple data
{
  "id": 123,
  "name": "Example"
}

// With metadata
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}

// Success confirmation
{
  "success": true,
  "message": "Operation completed successfully",
  "deleted": {
    "meeting_id": 123,
    "turns_deleted": 45
  }
}
```

## Testing Response Standards

When writing tests, verify both status codes and response structure:

```javascript
// Test error responses
expect(response.status).toBe(400);
expect(response.body).toHaveProperty('error');

// Test success responses  
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('data');
```