# Architectural Patterns

## Overview

This document establishes the core architectural patterns and conventions for the Cogito codebase, reflecting the recent modernization efforts.

## Module System

### ES6 Modules Standard
All JavaScript files use ES6 module syntax:

```javascript
// ✅ ES6 imports/exports
import express from 'express';
import { DatabaseAgent } from '../lib/database-agent.js';

export const router = express.Router();
export default router;
```

**Deprecated:** CommonJS `require()` and `module.exports` have been fully migrated.

### File Extensions
- All JavaScript modules use `.js` extension
- Explicit `.js` extensions required in import paths
- CommonJS `.cjs` files have been converted to `.js`

## File Organization

### Directory Structure
```
server/
├── routes/
│   ├── auth/                 # Authentication routes
│   ├── client-management/    # Client selection and management  
│   ├── meetings/            # Meeting CRUD and operations
│   ├── settings/            # User and system settings
│   └── *.js                 # Other route files
├── lib/                     # Shared business logic
├── middleware/              # Express middleware
├── services/                # Background services
└── config/                  # Configuration modules
```

### File Size Enforcement
- **Target**: ~100 lines per file for optimal AI comprehension
- **Hard Limit**: 200 lines (enforced by ESLint and pre-commit hooks)
- **Test Files**: Up to 300 lines allowed
- **Modularization**: Use `lib/component-name/` pattern for related modules

## API Response Patterns

### Standardized Responses
All routes use the `ApiResponses` helper for consistent HTTP responses:

```javascript
import { ApiResponses } from '../lib/api-responses.js';

// Standard patterns
return ApiResponses.success(res, data);
return ApiResponses.badRequest(res, 'Validation failed');
return ApiResponses.unauthorized(res, 'Authentication required');
return ApiResponses.internalError(res, 'Operation failed');
```

See [API Standards](./api-standards.md) for complete specifications.

## Database Patterns

### DatabaseAgent Abstraction
All database operations use the centralized `DatabaseAgent`:

```javascript
import { DatabaseAgent } from '../lib/database-agent.js';

const dbAgent = new DatabaseAgent();
await dbAgent.connect();

// Domain-specific operations
const meetings = await dbAgent.meetings.listWithStats(clientId);
const turns = await dbAgent.turns.getByMeetingId(meetingId);
```

### Transaction Handling
```javascript
const result = await dbAgent.transaction(async (client) => {
  // Multiple related operations
  const deleted = await dbAgent.turns.deleteByMeetingId(meetingId);
  const meeting = await dbAgent.meetings.deleteMeeting(meetingId);
  return { deleted, meeting };
});
```

## Route Organization

### Route Structure Pattern
```javascript
import express from 'express';
import { requireAuth } from './auth.js';
import { DatabaseAgent } from '../lib/database-agent.js';
import { ApiResponses } from '../lib/api-responses.js';

const router = express.Router();
const dbAgent = new DatabaseAgent();

// Connection middleware
router.use(async (req, res, next) => {
  // Database connection setup
});

// Route handlers with consistent error handling
router.get('/endpoint', requireAuth, async (req, res) => {
  try {
    // Implementation
    return ApiResponses.success(res, data);
  } catch (error) {
    console.error('Operation error:', error);
    return ApiResponses.internalError(res, 'Operation failed');
  }
});

export default router;
```

### Authentication Patterns
- Use `requireAuth` middleware for protected routes
- Extract user info from `req.session.user`
- Validate client context when required

## Code Quality Enforcement

### Automated Tools
- **ESLint**: File size limits, complexity checks, style rules
- **Pre-commit Hooks**: Prevent commits exceeding size limits
- **Jest**: ES6 module testing with experimental VM support

### Commands
```bash
npm run lint              # Full linting with file size checks
npm run lint:fix          # Auto-fix issues where possible  
npm run lint:check-sizes  # File size validation only
npm test                  # Run test suite
```

## Error Handling

### Centralized Error Logging
Use `DatabaseAgent.logError()` for consistent error tracking:

```javascript
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error);
  
  // Log to database
  await dbAgent.logError('operation_error', error, {
    userId: req.session?.user?.user_id,
    sessionId: req.sessionID,
    endpoint: `${req.method} ${req.path}`,
    severity: 'error',
    component: 'ComponentName'
  });
  
  return ApiResponses.internalError(res, 'Operation failed');
}
```

### Error Response Consistency
- Always use `ApiResponses` for HTTP errors
- Include helpful, user-friendly error messages
- Log technical details separately from user-facing messages

## Testing Patterns

### ES6 Module Testing
Jest configuration supports ES6 modules:
```json
{
  "test": "node --experimental-vm-modules node_modules/.bin/jest",
  "jest": {
    "testEnvironment": "node",
    "transform": {}
  }
}
```

### Test Structure
- Main tests in `tests/` directory
- Module-specific tests co-located with modules
- Database tests use `test-helpers/db-setup.js`

## Migration and Maintenance

### Schema Change Protocol
1. **Comprehensive search**: Always use `grep -r` across entire codebase
2. **Atomic updates**: Update ALL references in single commit
3. **Immediate testing**: Test end-to-end functionality after changes
4. **Documentation**: Update schema docs with changes

### Modernization Workflow
1. Identify legacy patterns using search tools
2. Create standardized replacements
3. Migrate incrementally with testing
4. Update documentation and tooling
5. Enforce patterns with automated checks

## Deprecated Patterns

### Avoid These Patterns
```javascript
// ❌ CommonJS (fully migrated)
const express = require('express');
module.exports = router;

// ❌ Direct res.status().json() (use ApiResponses)  
res.status(400).json({ error: 'Bad request' });

// ❌ Large monolithic files (break into modules)
// Files > 200 lines

// ❌ Mixed import styles (use consistent ES6)
const db = require('./db');
import express from 'express';
```

## Future Considerations

### Planned Improvements
- Complete API response standardization across all routes
- Enhanced error tracking and monitoring
- Performance optimization patterns
- Testing coverage improvements

### Monitoring
Use the conversion analysis script to track migration progress:
```bash
node scripts/convert-routes-to-api-responses.js
```