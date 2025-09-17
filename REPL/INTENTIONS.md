# REPL System for Cogito

## Purpose
Interactive Read-Eval-Print-Loop for exploring data, generating artifacts, and managing experiments without committing to codebase changes. Provides a safe space for rapid experimentation with immediate rollback capabilities.

## Core Problem Being Solved
The tension between **Generation ⟷ Commitment**: We generate many interesting ideas and can implement them quickly, but face cleanup problems when experiments get entangled with production code. The REPL provides an isolated experimentation space where we can explore freely without polluting the main codebase.

## Antagonistic Forces at Play

### **Speed ⟷ Understanding**
- LLM training pushes for quick solutions
- Codebase demands careful understanding
- REPL provides immediate feedback while maintaining safety

### **Exploration ⟷ Stability**  
- Need to try new ideas rapidly
- Need to keep production code clean
- REPL allows exploration without commitment

### **Integration ⟷ Independence**
- Artifacts need data access
- Artifacts must remain sandboxed for safety
- REPL bridges these worlds through controlled interfaces

## Architecture Overview

### Basic REPL Implementation
```javascript
// repl.js - Entry point
import repl from 'repl';
import { DatabaseAgent } from '../database/database-agent.js';
import { ArtifactGenerator } from './artifact-generator.js';
import { ExperimentManager } from './experiment-manager.js';

async function startCogitoRepl() {
  const db = new DatabaseAgent();
  await db.connect();
  
  const replServer = repl.start({
    prompt: 'cogito> ',
    useColors: true
  });
  
  // Inject tools into REPL context
  Object.assign(replServer.context, {
    db,
    artifact: new ArtifactGenerator(db),
    experiment: new ExperimentManager(db),
    // Utility functions
    table: console.table,
    save: (name, data) => {
      replServer.context[name] = data;
      console.log(`Saved as '${name}'`);
    }
  });
}
```

### Core Components

#### `artifact-generator.js`
**Purpose**: Generate Claude artifacts from database data
```javascript
class ArtifactGenerator {
  async generate(type, data) {
    // Generate artifact specification based on type
    // Types: 'reality-tree', 'future-tree', 'evaporating-cloud'
    // Returns artifact spec with embedded data
  }
  
  async bridge(artifact, endpoint) {
    // Generate code to connect artifact to database
    // Creates integration scripts
  }
}
```

#### `experiment-manager.js`
**Purpose**: Manage experimental sessions with rollback capability
```javascript
class ExperimentManager {
  async start(name) {
    // Begin transaction/savepoint
    // Track all changes made during experiment
  }
  
  async end(options = { keep: false }) {
    // Commit or rollback changes
    // Log experiment results
  }
  
  async review() {
    // Show current experiment changes
  }
}
```

#### `data-explorer.js`
**Purpose**: Interactive data exploration utilities
```javascript
class DataExplorer {
  async explore(query) {
    // Semantic search across tables
    // Returns formatted results
  }
  
  async schema(table) {
    // Show table structure
  }
  
  async sample(table, count = 5) {
    // Get sample data from table
  }
}
```

## REPL Commands

### Built-in Database Access
```javascript
cogito> await db.turns.recent(5)
// Returns last 5 turns

cogito> await db.meetings.search({ type: 'cogito_web' })
// Search meetings by criteria

cogito> await db.query('SELECT * FROM users LIMIT 3')
// Direct SQL when needed
```

### Artifact Generation
```javascript
cogito> data = await db.turns.semantic('conflict')
// Find turns about conflict

cogito> artifact = await artifact.generate('evaporating-cloud', data)
// Generate artifact with data

cogito> artifact.download('my-cloud.json')
// Save artifact to file
```

### Experiment Management
```javascript
cogito> experiment.start('test-reality-trees')
// Begin experimental session

cogito> // ... make changes, test ideas ...

cogito> experiment.review()
// See what changed

cogito> experiment.end({ keep: false })
// Rollback all changes
```

### Custom Commands
```javascript
.explore <query>    // Semantic search across all data
.generate <type>    // Generate artifact from current context
.bridge            // Create database bridge for last artifact
.rollback          // Undo last operation
.save <name>       // Save current result to variable
.load <file>       // Load data from file
.export <file>     // Export current context
```

## Workflow Examples

### Example 1: Exploring and Generating Artifacts
```javascript
cogito> // Find interesting conversation patterns
cogito> conflicts = await db.explore('disagreements conflicts tensions')
✓ Found 23 relevant turns

cogito> // Generate evaporating cloud to analyze
cogito> cloud = await artifact.generate('evaporating-cloud', conflicts)
✓ Generated artifact with 5 conflicts identified

cogito> // Test the artifact
cogito> results = await cloud.test()
✓ Artifact renders correctly, 2 conflicts resolved

cogito> // Save if useful
cogito> await db.artifacts.store(cloud)
✓ Saved artifact to database
```

### Example 2: Safe Experimentation
```javascript
cogito> experiment.start('genealogy-test')
✓ Started experiment 'genealogy-test'

cogito> // Try adding genealogical links
cogito> await db.query(`ALTER TABLE turns ADD COLUMN genealogy_links jsonb`)
✓ Column added (experimental)

cogito> // Test the concept
cogito> await processGenealogicalLinks(recentTurns)
✗ Error: Too complex, not worth it

cogito> experiment.end({ keep: false })
✓ Rolled back all changes
```

### Example 3: Artifact-Database Bridge
```javascript
cogito> // Create reality tree artifact
cogito> tree = await artifact.generate('reality-tree', await db.turns.recent(20))

cogito> // Generate bridge code
cogito> bridge = await artifact.bridge(tree, 'http://localhost:3000/api/trees')
✓ Generated integration code

cogito> bridge.code
// Shows generated Node.js script that connects artifact to database

cogito> bridge.save('reality-tree-integration.js')
✓ Saved integration script
```

## Integration with Claude Sessions

### Sharing Context
```javascript
cogito> claude.share(myData)
// Makes data available to Claude session

cogito> claude.ask("What patterns do you see?")
// Query Claude about current REPL context
```

### Artifact Round-Trip
```javascript
cogito> // Generate artifact spec
cogito> spec = await artifact.prepare('future-tree', currentData)

cogito> // Copy spec to Claude UI
cogito> spec.copyToClipboard()

// ... work in Claude artifact UI ...

cogito> // Import modified artifact
cogito> modified = await artifact.import('modified-tree.json')
cogito> await db.artifacts.store(modified)
```

## Implementation Plan

### Phase 1: Basic REPL (Immediate)
- [ ] Create `repl.js` entry point
- [ ] Wire up DatabaseAgent access
- [ ] Add basic commands (query, table, save)
- [ ] Test with simple database queries

### Phase 2: Artifact Integration (Next)
- [ ] Implement ArtifactGenerator class
- [ ] Add artifact generation commands
- [ ] Create bridge code generator
- [ ] Test with TOC-trees specifications

### Phase 3: Experiment Management (Future)
- [ ] Build ExperimentManager with rollback
- [ ] Add transaction/savepoint support
- [ ] Create experiment logging
- [ ] Test with complex experiments

### Phase 4: Claude Integration (Advanced)
- [ ] Create Claude context sharing
- [ ] Build artifact round-trip workflow
- [ ] Add collaborative features
- [ ] Test full workflow

## Benefits

1. **Rapid Experimentation**: Try ideas immediately without commitment
2. **Clean Codebase**: Experiments don't pollute production code
3. **Safe Rollback**: Undo changes easily
4. **Data Exploration**: Query and visualize data interactively
5. **Artifact Testing**: Generate and test artifacts in one flow
6. **Bridge Building**: Connect artifacts to database seamlessly

## Technical Requirements

### Dependencies
```json
{
  "dependencies": {
    "repl": "built-in",
    "pg": "existing",
    "chalk": "for colored output",
    "clipboard": "for copy operations"
  }
}
```

### Database Requirements
- Savepoint support for experiments
- Artifact storage table
- Experiment logging table

### File Structure
```
REPL/
├── INTENTIONS.md           # This file
├── repl.js                # Main entry point
├── artifact-generator.js   # Artifact generation
├── experiment-manager.js   # Experiment management
├── data-explorer.js       # Data exploration utilities
├── bridges/              # Generated bridge code
│   └── .gitignore       # Ignore generated bridges
└── experiments/         # Experiment logs
    └── .gitignore      # Ignore experiment data
```

## Success Metrics

- **Time to experiment**: < 30 seconds from idea to test
- **Rollback reliability**: 100% clean rollback
- **Artifact generation**: < 5 seconds for standard artifacts
- **Context switching**: Seamless between REPL and Claude

## Key Insights

The REPL represents a resolution to multiple tensions:
- **Generation ⟷ Commitment**: Generate freely, commit deliberately
- **Speed ⟷ Understanding**: Immediate feedback with safety nets
- **Integration ⟷ Independence**: Connected but not entangled
- **Exploration ⟷ Stability**: Explore wildly, deploy carefully

This tool embodies the lesson learned from our collaborative sessions: we need a space where the generative power of human-AI collaboration can flourish without the cleanup burden that typically follows experimentation.

## Packaging for Shared Use

### Multi-User Database Access Pattern

The REPL can be packaged to allow multiple users to work with the same database while maintaining isolation and security.

#### Configuration File Pattern
```javascript
// cogito-repl-config.json
{
  "database": {
    "host": "${COGITO_DB_HOST}",
    "database": "${COGITO_DB_NAME}",
    "user": "${COGITO_DB_USER}",
    "password": "${COGITO_DB_PASSWORD}",
    "ssl": true
  },
  "permissions": {
    "read_tables": ["turns", "meetings", "artifacts"],
    "write_tables": ["experiments", "artifacts"],
    "execute_functions": ["semantic_search", "generate_embedding"]
  },
  "experiment_mode": {
    "enabled": true,
    "auto_rollback": true,
    "max_duration_minutes": 60
  }
}
```

#### User Session Isolation
```javascript
// session-manager.js
class SessionManager {
  async createUserSession(userId, permissions) {
    // Create isolated schema for experiments
    const sessionSchema = `repl_session_${userId}_${Date.now()}`;
    await db.query(`CREATE SCHEMA IF NOT EXISTS ${sessionSchema}`);
    
    // Set search path for isolation
    await db.query(`SET search_path TO ${sessionSchema}, public`);
    
    return {
      sessionId: uuid(),
      schema: sessionSchema,
      cleanup: () => this.dropSchema(sessionSchema)
    };
  }
}
```

### Deployment Options

#### Option 1: NPM Package
```json
// package.json
{
  "name": "@cogito/repl",
  "version": "1.0.0",
  "bin": {
    "cogito-repl": "./bin/repl.js"
  },
  "peerDependencies": {
    "pg": "^8.0.0"
  }
}
```

Usage:
```bash
npm install -g @cogito/repl
cogito-repl --config ./my-config.json
```

#### Option 2: Docker Container
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["node", "repl-server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  cogito-repl:
    image: cogito/repl:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REPL_MODE=collaborative
    ports:
      - "3001:3001"
    volumes:
      - ./experiments:/app/experiments
      - ./artifacts:/app/artifacts
```

#### Option 3: Web-Based REPL
```javascript
// repl-server.js - Web interface for REPL
import express from 'express';
import { Server } from 'socket.io';
import { REPLSession } from './repl-session.js';

const app = express();
const io = new Server(app);

io.on('connection', (socket) => {
  const session = new REPLSession(socket.userId);
  
  socket.on('eval', async (code) => {
    const result = await session.eval(code);
    socket.emit('result', result);
  });
});
```

### Security Considerations

#### Read-Only Mode for New Users
```javascript
class SecureREPL {
  constructor(userRole) {
    this.permissions = this.getPermissions(userRole);
  }
  
  getPermissions(role) {
    switch(role) {
      case 'observer':
        return { read: true, write: false, experiment: false };
      case 'experimenter':
        return { read: true, write: false, experiment: true };
      case 'developer':
        return { read: true, write: true, experiment: true };
    }
  }
  
  async execute(command) {
    if (command.includes('DELETE') && !this.permissions.write) {
      throw new Error('Permission denied: DELETE requires write access');
    }
    // ... validate and execute
  }
}
```

#### Audit Logging
```javascript
class AuditLogger {
  async log(userId, command, result) {
    await db.query(`
      INSERT INTO repl_audit_log (user_id, command, result, timestamp)
      VALUES ($1, $2, $3, NOW())
    `, [userId, command, JSON.stringify(result)]);
  }
}
```

### Collaboration Features

#### Shared Experiments
```javascript
class SharedExperiment {
  async share(experimentId, withUsers) {
    // Make experiment visible to other users
    await db.query(`
      INSERT INTO shared_experiments (experiment_id, shared_with)
      VALUES ($1, $2)
    `, [experimentId, withUsers]);
  }
  
  async broadcast(message) {
    // Real-time collaboration
    this.collaborators.forEach(user => {
      user.socket.emit('experiment-update', message);
    });
  }
}
```

#### Artifact Marketplace
```javascript
class ArtifactMarketplace {
  async publish(artifact) {
    // Share artifacts between users
    return await db.artifacts.publish({
      ...artifact,
      author: this.userId,
      public: true,
      license: 'MIT'
    });
  }
  
  async discover(query) {
    // Find useful artifacts from other users
    return await db.artifacts.search({
      public: true,
      tags: query.tags,
      rating: { $gte: 4 }
    });
  }
}
```

### Installation Guide for Teams

```markdown
## Quick Start for Teams

1. **Clone the repository**
   ```bash
   git clone https://github.com/cogito/repl
   cd cogito-repl
   ```

2. **Configure database access**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up user permissions**
   ```bash
   npm run setup:users
   # Follow prompts to add team members
   ```

4. **Start the REPL server**
   ```bash
   npm run server
   # REPL available at http://localhost:3001
   ```

5. **Team members connect**
   ```bash
   cogito-repl connect --server http://localhost:3001 --user alice
   ```
```

### Use Cases for Shared REPL

1. **Team Exploration Sessions**
   - Multiple developers exploring data together
   - Shared experiments with real-time collaboration
   - Knowledge transfer through recorded sessions

2. **Training and Onboarding**
   - Safe environment for new team members
   - Guided tutorials with pre-loaded data
   - Learn by experimenting without risk

3. **Client Demonstrations**
   - Show data analysis capabilities
   - Generate artifacts during meetings
   - Let clients explore their own data safely

4. **Cross-Team Collaboration**
   - Data scientists and developers working together
   - Designers testing artifact visualizations
   - Product managers exploring user patterns

## Next Session Starting Points

1. **Quick Start**: Run `npm run repl` to start experimenting immediately
2. **First Test**: Try `db.turns.recent(5)` to verify database connection
3. **Artifact Test**: Generate a simple artifact from real data
4. **Experiment Test**: Start an experiment, make changes, rollback

The REPL is our laboratory - a place where ideas can be born, tested, and either promoted to production or gracefully discarded without leaving debris.