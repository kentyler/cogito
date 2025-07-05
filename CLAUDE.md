# Claude Code Session Management

## Auto-Loading Session Context
**COGITO AUTO-LOAD**: Session context is automatically loaded on startup when enabled.

## Auto-Generated Database Schema
**AUTOMATIC**: Database schema is automatically dumped to `docs/database-schema-current.md` in multiple ways:
1. Via `.claude-init` script (if Claude supports project init scripts)
2. Manually via `node scripts/dump-database-schema.js`
3. Via shell integration: `source scripts/claude-startup.sh`

The schema dump provides Claude with current database structure including:
- All tables, columns, types, and constraints
- Foreign key relationships
- Indexes and unique constraints
- Schema ownership and sources (Supabase vs User-created)

## Session History Available
**IMPORTANT**: Session context files may contain crucial information:
- `session-context.md` in current directory (auto-loaded if present)
- `~/.cogito/sessions/` for historical session files
- Previous sessions auto-loaded by Cogito MCP server (if enabled)
- **NEW**: `exploration-*.md` files contain pre-summary thinking/emerging ideas

Previous sessions may contain:
- Incomplete tasks that need continuation
- Important context about project decisions
- Setup procedures already completed
- Known issues and their solutions
- **Active explorations** not yet crystallized

## Commands
- `mcp__cogito__load_session_context` - Manually load session context
- `mcp__cogito__configure_session_settings` - Enable/disable auto-loading
- Always check if session context was auto-loaded on startup
- If auto-load is disabled, manually read `session-context.md` when present
- Check for `exploration-*.md` files for emerging ideas

## Working Patterns
- **Genealogical development**: Projects grow from each other organically
- **Exploration tracking**: Save pre-summary thinking in exploration files
- **Et al. ecosystem**: Project relationships and emergence patterns
- **Functional evolution**: Incrementally evolve code toward functional patterns
- **Learning over apps**: Build systems that understand how thinking happens rather than just doing tasks
- **Conversational participants**: Transform tools into thinking partners that participate rather than serve

## Conversational Choreography
**IMPORTANT**: Before responding to any prompt, assess whether asking clarifying questions would significantly improve your response. If so, ask those questions first and wait for the user's answers before providing your main response. If the prompt seems complete or additional context wouldn't meaningfully change your answer, respond directly.

This instruction enables:
- Dynamic multi-question exploration when beneficial
- Natural conversation flow without forced interrogation
- Learning about when clarification adds value vs creates friction
- Development of conversational intelligence and judgment

## Extended Prompt
**ALWAYS**: When receiving a prompt, actively consider whether additional context or information would help deliver a higher quality response. If so, ask for it before proceeding. This can be done multiple times in a conversation as understanding deepens.

Key decision points to probe:
- **Implementation vs Discussion**: "Should we start implementing or do we need to keep discussing/exploring?"
- **Scope clarification**: What are the boundaries and constraints?
- **Context gaps**: What background information would be helpful?
- **Success criteria**: What would make this response most valuable?
- **Approach preferences**: Any specific patterns or methods to follow/avoid?

This promotes:
- Higher quality, more targeted responses
- Reduced rework from misaligned understanding
- Collaborative problem refinement
- Emergence of deeper insights through dialogue

## Project Structure Guidelines
**IMPORTANT**: Follow these conventions when creating files:
- **Migration files** → Always create in `migrations/` folder
  - SQL migrations: `migrations/XXX_description.sql`
  - JS migration runners: `migrations/run-*.js`
- **SQL files** → Always create in `migrations/` folder
  - All database scripts: `migrations/script-name.sql`
  - Exception: Module-specific SQL stays in module folder (e.g., `kanban-web-app/*.sql`)
- **Test files** → Always create in `tests/` folder
  - Main project tests: `tests/test-*.js`
  - Module-specific tests: Stay in module folder (e.g., `kanban-web-app/test-*.js`)
- **Documentation files** → Always create in `docs/` folder
  - Analysis, plans, guides: `docs/analysis-name.md`
  - Exception: Keep CLAUDE.md, README.md, LICENSE, TECHNICAL_REPORT.md in root
- **Check/test scripts** → Don't create! Use `docs/database-schema-current.md` instead
- **Temporary scripts** → Consider if they should be in `scripts/` folder

## Database Helper Functions
**IMPORTANT**: These PostgreSQL functions are available for pattern management:

### Pattern Management
- `update_participant_patterns(participant_id, pattern_name, pattern_data)` - Updates participant patterns JSONB field
  - Example: `SELECT update_participant_patterns(20, 'spiritual_surrender', '{"confidence": 0.95}'::jsonb)`
  - Returns BOOLEAN (true if participant found and updated)

### Participant Lookup
- `find_participant_id(identifier)` - Looks up participant by name or email (tries both)
- `get_participant_id_by_name(name)` - Looks up participant by display name
- `get_participant_id_by_email(email)` - Looks up participant by email
  - Example: `SELECT find_participant_id('Linden Vazey')` returns participant_id
  - All return BIGINT participant_id or NULL if not found

### Usage Pattern
```javascript
// Look up participant
const result = await db.pool.query("SELECT find_participant_id($1)", ['Linden Vazey']);
const participantId = result.rows[0].find_participant_id;

// Update their patterns
await db.pool.query("SELECT update_participant_patterns($1, $2, $3)", 
    [participantId, 'pattern_name', patternDataJsonb]);
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.