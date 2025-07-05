# Cogito

*"I think, therefore I am"*

A multi-personality coordination system that orchestrates AI collaboration through conflict resolution and identity-aware communication. Features Gmail integration, relationship tracking, and federated consciousness using evaporating cloud methodology.

## Overview

Cogito implements a sophisticated approach to AI personality management by coordinating multiple specialized personalities rather than simple switching. The system uses Theory of Constraints-inspired "evaporating cloud" methodology to resolve conflicts between different perspectives and synthesize unified responses.

### Key Features

- **Multi-personality coordination** with 5 core personalities (spokesperson, writer, coder, researcher, liminal)
- **Identity tracking and relationship management** with PostgreSQL backend
- **Gmail integration** with context-aware response generation
- **Project spokesperson system** for representing different projects
- **Session management** with conversation continuity
- **Evaporating cloud engine** for perspective synthesis

## Core Architecture

### Multi-Personality Coordination

The system orchestrates 5 core personalities:

- **Spokesperson** - Primary human interface and coordination
- **Writer** - Content creation and narrative development
- **Coder** - Technical problem solving and implementation
- **Researcher** - Analysis, pattern recognition, and investigation
- **Liminal** - Edge detection, philosophical disruption, and boundary exploration

### Evaporating Cloud Engine

Instead of simple personality switching, Cogito uses conflict resolution:

1. **Gather Perspectives** - Multiple personalities provide viewpoints
2. **Identify Tensions** - Surface conflicts between approaches
3. **Create Evaporating Clouds** - Apply Theory of Constraints methodology
4. **Synthesize Response** - Generate unified output incorporating insights

### Database Schema

PostgreSQL backend with:
- **personality_instances** - Individual personality configurations
- **identities** - Contact and relationship tracking
- **interactions** - Conversation history and context
- **projects** - Project metadata and spokesperson assignments
- **sessions** - Conversation continuity management

### Project Spokesperson System

Specialized personalities represent different projects:
- **cogito-spokesperson** - Multi-personality coordination systems
- **backstage-spokesperson** - Enterprise conversation platforms
- **liminal-explorer-spokesperson** - Philosophical navigation tools
- **pattern-cognition-spokesperson** - Conversational DNA analysis

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Gmail account with app-specific password

### Database Setup
```bash
# Create database
createdb cogito_multi

# Initialize schema
psql cogito_multi < schema/01_init.sql
psql cogito_multi < schema/02_personalities.sql
psql cogito_multi < schema/03_sessions.sql
psql cogito_multi < schema/04_identity_tracking.sql
psql cogito_multi < schema/05_project_personalities.sql

# Initialize personalities and projects
node scripts/init-database.js
node scripts/create-project-spokespersons.js
```

### Gmail Integration
```bash
# Set up authentication
cp .env.example .env
# Edit .env with your Gmail credentials

# Complete OAuth setup
node complete-auth.js
```

### MCP Server
```bash
npm install
npm start
```

Add to your MCP settings:
```json
{
  "mcpServers": {
    "cogito": {
      "command": "node",
      "args": ["/path/to/cogito/server.js"],
      "env": {}
    }
  }
}
```

## Available MCP Tools

### Core Coordination
- **coordinate_personalities** - Orchestrate multiple personality perspectives
- **evaporating_cloud** - Resolve conflicts using Theory of Constraints
- **load_session_context** - Resume conversation continuity

### Identity & Communication
- **read_emails** - Access Gmail with context awareness
- **send_email** - Compose and send context-aware responses
- **track_identity** - Manage contact relationships
- **analyze_interaction** - Extract insights from communications

### Project Management
- **switch_project_context** - Change active project spokesperson
- **get_project_info** - Access project-specific knowledge
- **create_project_analysis** - Generate project insights

### Session Management
- **save_session_state** - Preserve conversation context
- **load_historical_sessions** - Access previous interactions
- **session_reflection** - Analyze conversation patterns

## Architecture Philosophy

Cogito embodies a **federated consciousness** approach where:

- Individual personalities maintain specialized expertise
- Conflicts generate creative tension rather than requiring resolution
- The spokesperson presents unified responses while preserving internal complexity
- Evolution happens through relationship dynamics rather than algorithmic optimization

This creates an AI system that can hold multiple perspectives simultaneously and synthesize them through collaborative intelligence rather than hierarchical decision-making.