# PostgreSQL Setup for Cogito Multi

This document outlines the steps to set up PostgreSQL for the Cogito Multi-Personality system.

## Prerequisites

1. **Docker Desktop** installed with WSL integration enabled
2. **Node.js** 18+ installed

## Setup Steps

### 1. Enable Docker WSL Integration

If Docker commands aren't working in WSL:

1. Open Docker Desktop
2. Go to Settings → Resources → WSL Integration
3. Enable integration for your WSL distribution
4. Restart WSL: `wsl --shutdown` then reopen terminal

### 2. Start PostgreSQL Container

```bash
# Start PostgreSQL with Docker Compose
npm run docker:up

# Check if container is running
docker ps

# View PostgreSQL logs
npm run docker:logs
```

### 3. Verify Database Setup

```bash
# Test database connection and setup
npm run setup-postgres
```

### 4. Migrate from SQLite (if applicable)

```bash
# Migrate existing SQLite data to PostgreSQL
npm run migrate-from-sqlite
```

### 5. Start the Application

```bash
# Start in development mode
npm run dev

# Or start in production mode
npm start
```

## Database Configuration

The database connection is configured via environment variables in `.env`:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=cogito_multi
POSTGRES_USER=cogito
POSTGRES_PASSWORD=cogito_dev_password
```

## Docker Compose Services

- **postgres**: PostgreSQL 15 database server
- Automatically creates `cogito_multi` database
- Applies schema from `./schema/01_init.sql`
- Persistent data stored in Docker volume `postgres_data`

## Useful Commands

```bash
# Stop containers
npm run docker:down

# Connect to PostgreSQL CLI
docker compose exec postgres psql -U cogito -d cogito_multi

# Backup database
docker compose exec postgres pg_dump -U cogito cogito_multi > backup.sql

# View container status
docker compose ps
```

## Schema Features

- **BIGSERIAL** primary keys (auto-incrementing integers)
- **JSONB** columns for flexible configuration storage
- **Array** support for multi-value relationships
- **Views** for common query patterns
- **Indexes** optimized for common access patterns

## Troubleshooting

### Docker not found in WSL
- Enable WSL integration in Docker Desktop settings
- Restart WSL: `wsl --shutdown`

### Connection refused
- Ensure Docker container is running: `npm run docker:up`
- Check container logs: `npm run docker:logs`

### Database does not exist
- Check Docker initialization logs
- Verify schema files in `./schema/` directory
- Container may still be initializing (wait 30 seconds)

### Migration issues
- Ensure PostgreSQL is running before migration
- Check that SQLite file exists at `./cogito.db`
- Review migration script output for specific errors