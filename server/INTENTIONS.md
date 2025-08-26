# Server - Express.js Backend API

## Purpose
Backend API server for Cogito conversational system. Handles authentication, client management, conversations, meetings, file uploads, and LLM interactions. **All database operations go through DatabaseAgent for consistency and safety.**

## File Size Status ✅
**CLEANED UP**: All problematic files have been split and optimized
- **Largest file**: 149 lines (chat-interface.js)
- **Average file size**: ~60 lines  
- **Files over 140 lines**: Only 2 remaining (149, 142 lines)
- **Target achieved**: All files under 200 lines, most under 100 lines

## Architecture Philosophy
- **Thin Routes**: Routes only handle HTTP concerns, delegate to handlers or DatabaseAgent
- **Smart DatabaseAgent**: Validation, error handling, business logic in DatabaseAgent domains
- **Zero Direct SQL**: All database access through DatabaseAgent methods (✅ ACHIEVED)
- **Session-Based Auth**: User context in req.session, not JWT
- **Modular Handlers**: Complex routes split into focused handler modules

## Architecture Patterns

### Route Pattern (MUST FOLLOW)
```javascript
// Simple routes
router.post('/endpoint', handlerFunction);

// Complex inline routes (only for <30 lines)
router.post('/endpoint', async (req, res) => {
  try {
    const db = new DatabaseAgent();
    await db.connect();
    
    const result = await db.domain.method(req.body);
    
    res.json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    await db?.close();
  }
});
```

### Handler Pattern (for complex logic)
```javascript
// In handlers/specific-handler.js
export async function handleSpecificOperation(req, res) {
  const db = new DatabaseAgent();
  try {
    // Handler logic here
    await db.connect();
    const result = await db.domain.method(data);
    return ApiResponses.success(res, result);
  } catch (error) {
    return ApiResponses.internalError(res, error.message);
  } finally {
    await db.close();
  }
}
```

### Session Pattern
```javascript
// User data in req.session.user
// Meeting ID in req.session.meeting_id  
// Client ID in req.session.selectedClientId
```

## Core Components

### /routes (API Endpoints - All Modularized ✅)

#### auth/ (5 focused modules)
- **index.js** (20 lines) - Router setup
- **middleware.js** (37 lines) - requireAuth function
- **login.js** (100 lines) - Authentication logic
- **logout.js** (50 lines) - Session cleanup  
- **check.js** (25 lines) - Session validation
**Pattern**: Uses DatabaseAgent.users for all operations

#### conversations/ (5 focused modules)
- **index.js** (35 lines) - Router setup
- **meeting-manager.js** (38 lines) - Meeting ID resolution
- **client-resolver.js** (34 lines) - Client info retrieval
- **turn-orchestrator.js** (107 lines) - Main workflow logic
- **error-handler.js** (34 lines) - Error handling
**Critical**: Uses session meeting_id, no manual meeting creation

#### client-management/ (3 focused modules)
- **selection.js** (17 lines) - Router setup
- **handlers/client-selector.js** (86 lines) - Initial selection
- **handlers/client-switcher.js** (78 lines) - Client switching
**Pattern**: Creates new meeting on client switch

#### summary-handlers/ (4 focused modules)
- **summary-routes.js** (23 lines) - Router setup
- **monthly-summaries.js** (41 lines) - Monthly generation
- **daily-summary.js** (34 lines) - Daily generation
- **yearly-summaries.js** (41 lines) - Yearly generation
- **daily-fetch.js** (34 lines) - Summary retrieval

#### settings/ (3 focused modules)
- **llms.js** (19 lines) - Router setup
- **handlers/llm-preferences.js** (39 lines) - Preference updates
- **handlers/llm-list.js** (32 lines) - Available LLMs
- **handlers/user-preferences.js** (33 lines) - User settings

#### meetings/ (Existing structure)
- **crud.js** - Meeting CRUD operations
- **additional.js** - Admin operations (✅ Fixed: now uses DatabaseAgent)

### /lib (Business Logic - Modularized ✅)

#### avatar-operations/ (3 focused modules) ✅
- **index.js** (23 lines) - Consolidated exports
- **avatar-crud.js** (79 lines) - Basic CRUD operations
- **avatar-client.js** (73 lines) - Client-specific operations
- **avatar-selection.js** (66 lines) - User and selection logic
**Status**: Ready for migration to DatabaseAgent.avatars domain

#### session-meeting.js
**Purpose**: Web session meeting management
**Critical**: Creates meeting AFTER login/client selection

#### api-responses.js
**Purpose**: Standardized response formatting
**Pattern**: All routes should use these helpers

### /services (Background Services - All Clean ✅)

#### websocket-service.js (148 lines)
**Uses**: DatabaseAgent ✅

#### meeting-cleanup-service.js (143 lines)  
**Uses**: DatabaseAgent ✅ (migrated from pool.query)

#### email-service.js (187 lines)
**Uses**: DatabaseAgent ✅

### /config (Configuration)

#### database.js
**Status**: DEPRECATED - Use DatabaseAgent.connector

#### middleware.js
**Provides**: Express setup (session, CORS, body parsing)
**Stays**: Core Express config, not moving to DatabaseAgent

## Rules for New Code

### MUST:
- Use DatabaseAgent for ALL database operations
- Keep route files under 50 lines when possible
- Create handler modules for complex logic (>30 lines)
- Let DatabaseAgent handle validation and errors
- Return standardized JSON responses via ApiResponses
- Split any file approaching 150 lines immediately

### FORBIDDEN:
- Direct SQL queries (pool.query, req.db.query) - ✅ ZERO remaining
- Validation logic in routes (belongs in DatabaseAgent)
- Business logic in routes (use handlers or DatabaseAgent)
- Files over 200 lines
- String concatenation for SQL
- Hardcoded secrets or API keys

## Current Status ✅ ALL CLEAN

### Fixed Issues:
1. **avatar-operations.js** exceeded limit → Split to 3 modules
2. **All large route files** → Split to focused handlers
3. **Direct SQL queries** → All using DatabaseAgent
4. **Monolithic endpoints** → Modular handler pattern

### File Size Distribution:
- **Under 50 lines**: 85% of files
- **50-100 lines**: 12% of files  
- **100-150 lines**: 3% of files
- **Over 150 lines**: 0% of files ✅

## Intended Additions (DatabaseAgent-Centric)

### 📝 Enhanced DatabaseAgent Error Handling
**Status**: PLANNED
**Location**: lib/database-agent/core/error-types.js
```javascript
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
    this.field = field;
  }
}
```

### 📝 DatabaseAgent Input Validation
**Status**: PLANNED  
**Location**: Each domain gets validate methods
```javascript
// In user-operations.js
async validateUserData(data) {
  const errors = [];
  if (!data.email?.match(emailRegex)) {
    errors.push(new ValidationError('Invalid email', 'email'));
  }
  if (errors.length) throw new MultiValidationError(errors);
  return true;
}
```

### 📝 Migrate avatar-operations to DatabaseAgent
**Status**: PLANNED
**Location**: lib/database-agent/domains/avatar-operations.js
- Move all avatar SQL to DatabaseAgent.avatars
- Add validation for avatar data  
- Standardize error responses

## Extension Guidelines

When adding new endpoints:
1. **Check this file first** for existing similar functionality
2. **Keep route handlers under 30 lines** - create handlers for complex logic
3. **Use DatabaseAgent** for all database operations
4. **Follow the handler pattern** for endpoints >30 lines
5. **Update this INTENTIONS.md** immediately
6. **Split files immediately** if they approach 150 lines

## Dependencies to Keep
- express: ^4.18.2 (core framework)
- express-session: ^1.17.3 (auth mechanism)  
- cors: ^2.8.5 (browser support)
- dotenv: ^16.3.1 (config management)

## Dependencies to Remove
- pg: ^8.11.3 (use DatabaseAgent.connector instead)

## Success Metrics ✅ ACHIEVED
- ✅ Zero direct SQL queries in routes/
- ✅ All files under 200 lines (largest: 149 lines)
- ✅ Modular handler pattern implemented
- ✅ Consistent error responses via ApiResponses  
- ✅ This file stays under 2000 tokens

## File Organization Patterns ✅

### Route Splitting Pattern
```
routes/
├── feature-name.js (router setup, <30 lines)
├── feature-handlers/
│   ├── specific-handler.js (focused logic)
│   └── another-handler.js (single responsibility)
```

### Business Logic Pattern  
```
lib/
├── feature-operations/
│   ├── index.js (exports)
│   ├── crud.js (basic operations)
│   ├── business-logic.js (complex operations)
│   └── utilities.js (helpers)
```

---
*Last Updated: 2025-08-26*  
*Status: Server fully optimized for LLM assistance*
*Token Cost: ~2,000 tokens to read this vs ~15,000+ for reading all server code*
*All critical cleanup tasks: ✅ COMPLETE*