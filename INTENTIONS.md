# Cogito - Conversational Intelligence System

## Purpose
**"Capture conversations so that they can be data for both humans and LLMs thinking about them."**

Cogito transforms discussions into queryable, analyzable data by capturing conversations from multiple sources (meetings, browser interactions, API calls) and making them semantically searchable. It focuses on pattern recognition, participant interactions, and emergent conversation dynamics.

## System Architecture Overview

### 🏗️ **Core Components**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Browser Ext    │    │   Web Frontend  │    │  Golden Horde   │
│  (Capture)      │────│   (Interact)    │────│   (Separate)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Express Server │
                    │  (Orchestrate)  │ ←─── server/INTENTIONS.md
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Shared Lib     │
                    │  (Process)      │ ←─── lib/INTENTIONS.md (planned)
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  PostgreSQL     │
                    │  + pgvector     │
                    └─────────────────┘
```

### 📁 **Component Responsibilities**

#### **server/** ✅ [Has INTENTIONS.md]
- **Express.js API server** handling authentication, conversations, meetings
- **Session management** with multi-client support
- **DatabaseAgent integration** for all database operations
- **Modular route handlers** (all files under 150 lines)

#### **lib/** 
- **DatabaseAgent** - Centralized database operations with domain-specific modules
- **Processing agents** - Turn embedding, pattern recognition, semantic search
- **Business logic** - File upload, transcript processing, game state management
- **Integration services** - Browser extension APIs, webhook handlers

#### **public/**
- **Web frontend** - Main conversation interface (JavaScript modules)
- **Admin interfaces** - Client and user management
- **Golden Horde UI** - Separate application interface

#### **browser-extension/**
- **Content capture** - Extract conversations from web pages
- **Authentication** - OAuth integration with main system  
- **Real-time sync** - Send captured data to Cogito server

#### **migrations/**
- **Database evolution** - Schema migrations in chronological order
- **Data transformations** - Scripts for major structural changes

## Key Architectural Principles

### 🎯 **Data-First Design**
- **Events, turns, and participant interactions are primary** - UI derives from data
- **Write-once immutable** - Turns and interactions never edited, only analyzed
- **Pattern emergence** - Meaning surfaces from participant interactions over time

### 👥 **Multi-Tenant Architecture** 
- **Client isolation** - Each organization's data completely separate
- **User-client relationships** - Users can belong to multiple clients
- **Session-based auth** - Smooth client switching without re-login

### 🧠 **Semantic Intelligence**
- **Vector embeddings** - Turn-level embeddings for semantic search
- **Pattern recognition** - Surface cognitive patterns and conversation themes
- **Context preservation** - Conversations maintain relationship and context data

### 🔄 **Agent-Based Processing**
- **DatabaseAgent** - All database access through domain-specific operations
- **Processing agents** - Transcript analysis, embedding generation, pattern detection
- **Game state agents** - Track conversational states and transitions

## Current Technology Stack

### **Backend**
- **Express.js** - API server with modular routes
- **PostgreSQL** - Primary database with pgvector extension
- **Node.js** - Runtime (v18+, ES modules)

### **Frontend** 
- **Vanilla JavaScript** - Modular frontend without heavy frameworks
- **ClojureScript** - Legacy components being migrated to JavaScript

### **AI/ML Integration**
- **OpenAI APIs** - Embedding generation and LLM responses
- **Anthropic Claude** - Advanced conversation processing
- **Vector search** - Semantic similarity and pattern matching

### **Infrastructure**
- **Render.com** - Production hosting
- **GitHub** - Source control and CI/CD

## Development Patterns & Guidelines

### 🎨 **File Organization**
```
feature-name/
├── INTENTIONS.md          # Feature-specific architectural guide
├── main-module.js         # Core functionality (<100 lines ideal)
├── handlers/              # Complex logic broken into handlers
│   ├── specific-handler.js
│   └── another-handler.js
└── utils/                 # Supporting utilities
    └── helpers.js
```

### 📏 **Size Constraints**
- **Target**: 100 lines per file
- **Hard limit**: 200 lines (enforced by pre-commit hooks)
- **Split immediately** when approaching 150 lines

### 🗄️ **Database Patterns**
- **All DB access** through DatabaseAgent domains
- **Schema verification** before any SQL operations
- **Parameterized queries** only - zero string concatenation
- **Transaction support** for multi-step operations

### 🔗 **API Patterns**
- **Standardized responses** via ApiResponses helper
- **DatabaseAgent integration** in all routes
- **Session-based authentication** with client context
- **Modular handlers** for complex endpoints

## Component Details & Navigation

### **server/** - Backend API ✅ Optimized
- **Status**: Fully modularized, all files under 150 lines
- **Guide**: See `server/INTENTIONS.md` for detailed patterns
- **Key**: Express routes, DatabaseAgent integration, session management

### **lib/** - Shared Business Logic
- **Status**: Needs INTENTIONS.md
- **Structure**: DatabaseAgent domains, processing agents, utilities
- **Key**: database-agent/, game-state-agent/, file-upload/, semantic-search

### **public/** - Web Frontend
- **Status**: Needs review and possible INTENTIONS.md  
- **Structure**: Modular JavaScript, multiple applications
- **Key**: Main Cogito UI, admin interfaces, Golden Horde

### **browser-extension/** - Capture Integration
- **Status**: Self-contained, may benefit from INTENTIONS.md
- **Structure**: Manifest V3 extension with content/background scripts
- **Key**: Web page conversation capture, OAuth flow

### **migrations/** - Database Evolution
- **Status**: Well-organized, chronological
- **Pattern**: SQL files + JavaScript runners for complex migrations
- **Key**: Schema evolution history, data transformation scripts

## Getting Started

### **New Feature Development**
1. **Read relevant INTENTIONS.md** files to understand patterns
2. **Choose appropriate component** based on responsibility
3. **Follow established patterns** (DatabaseAgent, modular handlers, size limits)
4. **Create/update INTENTIONS.md** for new features
5. **Verify with linting** and pre-commit hooks

### **Architecture Navigation**
- **System overview**: This file (project root)
- **Backend details**: `server/INTENTIONS.md`
- **Database patterns**: `lib/database-agent/` documentation
- **Historical context**: `intentions.edn` (comprehensive EDN format)

### **Common Operations**
```bash
# Start development
npm run start

# Run tests
npm test

# Check file sizes and linting
npm run lint

# Database operations
npm run prod-db
```

## Design Philosophy

### **LLM-First Development**
- **INTENTIONS.md files** optimize for LLM understanding
- **Small, focused files** enable complete comprehension
- **Clear patterns** prevent repetitive investigation
- **Architectural memory** preserved in documentation

### **Conversational Intelligence**
- **Conversations as data** - Every interaction becomes queryable
- **Pattern emergence** - Meaning surfaces from repeated interactions  
- **Participant-centric** - All actions tied to conversation participants
- **Context preservation** - Relationships and history shape meaning

### **Progressive Development**
- **Start simple** - Build working solutions first
- **Iterate toward functional** - Gradually adopt more functional patterns
- **Learn over apps** - Build systems that understand thinking processes
- **Transform tools into partners** - Move from servant to participant relationships

## Status & Roadmap

### ✅ **Completed**
- Backend API fully modularized and optimized
- DatabaseAgent pattern established
- Multi-client authentication system
- Web session meeting architecture
- Pre-commit verification hooks

### 🔄 **In Progress**
- Frontend JavaScript migration from ClojureScript
- DatabaseAgent domain expansion
- Pattern recognition improvements

### 📋 **Planned**
- `lib/INTENTIONS.md` creation
- Enhanced LLM integration patterns
- Advanced conversation analysis features
- Golden Horde application integration

---

**Architecture Files:**
- **This file**: System overview and navigation
- **server/INTENTIONS.md**: Backend API patterns ✅
- **intentions.edn**: Comprehensive technical details (EDN format)

**Token Efficiency**: ~2,000 tokens to understand entire system vs ~50,000+ reading all components

*"Every conversation is data waiting to reveal patterns of thinking."*