# Migrations Directory

This directory contains all database migration files, SQL scripts, and runners.

## File Naming Conventions

### SQL Migration Files
- Format: `XXX_description.sql` where XXX is a sequential number
- Example: `015_add_user_preferences.sql`

### SQL Scripts (General)
- Format: `descriptive-name.sql`
- Example: `create-user-table.sql`, `insert-default-data.sql`

### JavaScript Migration Runners
- Format: `run-description.js`
- Example: `run-user-preferences-migration.js`

## Current Migrations

1. `003_locations.sql` - Adds locations table
2. `004_locations_metadata.sql` - Adds metadata to locations
3. `005_pgvector_setup.sql` - Sets up pgvector extension
4. `006_conversation_to_blocks_migration.sql` - Migrates conversations to blocks architecture
5. `007_migrate_participant_patterns.sql` - Migrates participant patterns
6. `008_remove_conversation_tables.sql` - Removes old conversation tables
7. `009_schema_separation.sql` - Separates schemas by domain
8. `010_events_schema.sql` - Creates events schema
9. `011_files_schema.sql` - Creates files schema
10. `012_remove_rigid_structures.sql` - Removes rigid structural constraints
11. `013_add_participant_invitations.sql` - Adds invitation system
12. `014_backstage_foundation_migration.sql` - Backstage integration foundation

## Running Migrations

```bash
# Run a specific migration
node migrations/run-migration-name.js

# Run SQL migration directly
psql $DATABASE_URL < migrations/XXX_description.sql
```

## Important Notes

- **Always create ALL SQL files in this directory** (except module-specific ones)
- Never modify existing migrations that have been run
- Test migrations on a development database first
- Document any complex migrations with comments
- SQL scripts for setup, data insertion, etc. belong here too