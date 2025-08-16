# Production Database Access

This guide explains how to run database operations against the production database while keeping the MCP server and regular development work on the dev database.

## Files Created

- **`.env.prod`** - Contains production database credentials (gitignored)
- **`scripts/run-on-prod.js`** - Helper script for production database operations
- **`npm run prod-db`** - Package script shortcut

## Usage Examples

### Run SQL Queries
```bash
# Check table exists
npm run prod-db "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_games')"

# Count records
npm run prod-db "SELECT COUNT(*) FROM client_games"

# View recent games
npm run prod-db "SELECT name, status, created_at FROM client_games ORDER BY created_at DESC LIMIT 5"

# Search for specific cards
npm run prod-db "SELECT name, jsonb_object_keys(game_data->'cards') as card_names FROM client_games WHERE client_id = 1"
```

### Run Migration Files
```bash
# Run a migration
npm run prod-db migrations/021_create_client_games.sql

# Run any SQL file
npm run prod-db path/to/your-query.sql
```

### Direct Script Usage
```bash
# Alternative to npm script
node scripts/run-on-prod.js "SELECT * FROM client_games LIMIT 3"
node scripts/run-on-prod.js migrations/some-migration.sql
```

## Safety Features

- **Connection logging** - Shows which database you're connecting to
- **Query preview** - Shows first 50 characters of the query being run  
- **Row limiting** - Table output limited to first 10 rows for readability
- **Error handling** - Clear error messages if operations fail
- **Execution timing** - Shows how long operations took

## Development vs Production

| Operation | Database Used | How |
|-----------|---------------|-----|
| **MCP Server** | Dev (_2) | Always uses local `.env` |
| **Web App** | Dev (_2) | Uses local `.env` DATABASE_URL |
| **Production Operations** | Prod | Uses `.env.prod` via `npm run prod-db` |
| **Database Migrations** | Either | Specify which environment |

## Security Notes

- `.env.prod` is gitignored and should never be committed
- The production helper script shows database host but masks full credentials
- Always double-check you're running operations against the intended database
- Consider backing up before running destructive operations on production

## Example Workflow: Adding a Migration

```bash
# 1. Test migration on dev first (normal development)
node scripts/apply-migration.js migrations/new-feature.sql

# 2. After testing, apply to production
npm run prod-db migrations/new-feature.sql

# 3. Verify it worked
npm run prod-db "DESCRIBE new_table" 
```

This setup gives you full control over both environments while keeping development simple.