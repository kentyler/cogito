# Lib Folder Architecture

**Purpose**: Core library modules and services for the Cogito system. Contains modular, focused components optimized for LLM-assisted development.

**Token Optimization**: 🎯 **~2,000 tokens** (down from ~8,000 in monolithic structure)

---

## Core Architectural Principles

### File Size Constraints
- **Hard limit**: 200 lines per file (enforced by ESLint and pre-commit hooks)
- **Target**: ~100 lines per focused module
- **Result**: Improved AI comprehension, easier debugging, better maintainability

### Database Access Patterns
- **✅ Required**: All database operations MUST use `DatabaseAgent` pattern
- **❌ Forbidden**: Direct `pool.query()` calls are prohibited
- **Pattern**: `await this.databaseAgent.connector.query(sql, params)`
- **Domain-specific**: Use specialized domains like `dbAgent.turns.findSimilarTurns()`

### Modular Architecture
- **Component folders**: Large systems split into focused modules (e.g., `speaker-profile-agent/`)
- **Entry points**: Main files become simple re-exports for backward compatibility
- **Specialization**: Each module handles one specific responsibility

---

## Component Architecture

### 🔧 Core Infrastructure

#### `database-agent.js` (50 lines)
**Purpose**: Central database operations coordinator  
**Pattern**: Orchestrates specialized domain modules
```javascript
// Usage pattern
const db = new DatabaseAgent();
await db.turns.findSimilarTurns(turnId, limit);
```

#### `embedding-service.js`
**Purpose**: Vector embedding generation and operations  
**Integration**: Used by turn-processor and file-upload services

#### `turn-processor.js` (117 lines)
**Purpose**: Turn creation with embedding generation  
**Clean**: ✅ Converted from direct SQL to DatabaseAgent pattern
**Key methods**: `createTurn()`, `findSimilarTurns()`, `searchTurns()`

---

### 🧠 AI Processing Components

#### AI Agent Systems (REMOVED)
**Note**: Fragment extraction and tree assembly systems were removed as they represented over-organization that LLMs can handle natively. The functionality has been integrated into the core conversation processing pipeline.

#### `speaker-profile-agent/` (Modular System)
**Purpose**: Speaker identification and profile generation  
**Clean**: ✅ Converted from direct SQL to DatabaseAgent pattern
**Architecture**: Modular components:

- **`speaker-identifier.js`** (144 lines): User alias mapping and caching
- **`profile-generator.js`** (139 lines): Social context profile generation
- **`profile-storage.js`** (100 lines): Profile storage as pseudo-files

**Usage**: `const userId = await speakerAgent.processSpeaker(speakerName, meetingId)`

---

### 📁 File Management

#### `file-upload/` (Modular System)
**Purpose**: File upload, content extraction, and vector processing
**Components**:

- **`content-extractor.js`** (107 lines): Multi-format text extraction
- **`vector-embedding-service.js`** (76 lines): Chunk processing and embeddings  
- **`file-upload-service.js`**: Main upload orchestrator

**Future Enhancements**: PDF and Word document extraction (TODOs documented)

---

### 🗃️ Database Operations

#### `database-agent/` (Clean Architecture)
**Purpose**: Organized database operations with domain-specific modules
**Structure**:
- **`core/`**: Connection and schema inspection
- **`domains/`**: Business logic organized by domain (users, turns, meetings, files, etc.)
- **`specialized/`**: Complex operations (transcript processing, search analysis)
- **`utils/`**: Query building and validation utilities

**Cleanup**: ✅ Removed unused archive/ folder containing legacy code

**Domain Pattern**: Each domain provides focused operations:
```javascript
// Turn operations
await db.turns.createTurn(turnData);
await db.turns.findSimilarTurns(turnId, limit, minSimilarity);

// User operations  
await db.users.findUsersByEmail(email);
await db.users.getUserClients(userId);
```

---

## Code Quality Standards

### ✅ Completed Improvements

1. **File Size Optimization**
   - Removed over-organizational AI agent systems (fragment extraction & tree assembly)
   - All files now under 200-line limit

2. **Database Access Patterns**
   - Fixed direct SQL queries in `turn-processor.js`
   - Fixed direct SQL queries in all `speaker-profile-agent/` modules
   - All components now use DatabaseAgent pattern

3. **Code Cleanup**
   - Reviewed and improved TODO comments with implementation guidance
   - Removed unused archive folder with 20+ legacy files
   - Maintained backward compatibility through re-export pattern

### 🎯 Development Guidelines

**When adding new features:**
1. Keep files under 200 lines (ideally ~100)
2. Use DatabaseAgent for all database operations  
3. Create modular folder structure for complex components
4. Provide clear TODO comments for future enhancements
5. Test with both new modular imports and legacy re-exports

**When refactoring:**
1. Split large files into focused modules first
2. Convert direct SQL to DatabaseAgent operations
3. Create index.js entry point for backward compatibility
4. Remove unused/deprecated code immediately

---

## Dependencies & Integration

### External Dependencies
- **UUID generation**: `uuid` package for unique identifiers
- **PostgreSQL**: `pg` package via DatabaseAgent abstraction
- **File processing**: Native Node.js fs operations

### Internal Integration Points
- **Server routes**: Import lib services for business logic
- **File upload**: Integrates with context storage and vector processing  
- **Meeting processing**: Uses turn processor, speaker identification, and tree assembly
- **LLM operations**: Embedding generation and semantic search capabilities

---

## Success Metrics

### Token Efficiency
- **Before**: ~8,000 tokens to understand lib folder
- **After**: ~2,000 tokens with focused INTENTIONS.md
- **Improvement**: 75% reduction in context overhead

### Code Quality
- **File count**: 20+ core modules, all under 200 lines
- **SQL queries**: 100% use DatabaseAgent pattern
- **Architecture**: Clean separation of concerns with modular design
- **Legacy code**: Removed 20+ unused archive files

### Developer Experience
- **AI assistance**: Improved comprehension with small, focused files
- **Debugging**: Easier to isolate issues in specific modules
- **Maintenance**: Clear boundaries and responsibilities
- **Testing**: Simplified unit testing with focused components

---

*This INTENTIONS.md represents the systematically cleaned and optimized lib folder architecture, following the Zero-Persistence UDE Principle - fix problems when they're cheap to fix.*