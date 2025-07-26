# Cogito

A conversation capture and analysis system that transforms discussions into queryable data for both humans and LLMs.

## What is Cogito?

Cogito captures conversations from various sources (meeting transcripts, browser extensions, API interactions) and makes them searchable and analyzable. It focuses on:

- **Conversation as Data**: Every turn, interaction, and pattern becomes queryable information
- **Multi-tenant Architecture**: Supports multiple client organizations with data isolation
- **Semantic Search**: Uses embeddings to find meaning beyond keyword matching
- **Pattern Recognition**: Surfaces emergent themes and cognitive patterns from participant interactions

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+) with pgvector extension
- OpenAI API key (for embeddings)
- Anthropic API key (for Claude integration)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/cogito.git
cd cogito
npm install
```

### 2. Database Setup

```bash
# Create database
createdb cogito

# Run migrations (in order)
psql cogito < migrations/*.sql
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For embeddings generation
- `ANTHROPIC_API_KEY` - For Claude integration
- `SESSION_SECRET` - For session management

### 4. Start the Conversational REPL

```bash
cd conversational-repl
npm install
npx shadow-cljs compile app  # Compile ClojureScript frontend
node server.js                # Start the server
```

Access at http://localhost:3000

## Key Components

- **Conversational REPL** (`conversational-repl/`) - Web interface for real-time conversation analysis
- **Database Agent** (`lib/database-agent.js`) - Consistent database operations without schema guessing
- **Browser Extension** (`browser-extension/`) - Captures conversations from Claude and ChatGPT
- **Meeting Bot** - Integrates with Recall.ai to capture and analyze meeting transcripts

## Architecture Documentation

For detailed architecture and design decisions, see:
- `intentions.edn` - Comprehensive architectural documentation
- `CLAUDE.md` - Development patterns and operational instructions
- `docs/database-schema-current.md` - Auto-generated database schema

## Development

### ClojureScript Changes
After modifying any `.cljs` files:
```bash
cd conversational-repl
npx shadow-cljs compile app
```

### Database Schema
The schema is automatically documented. To regenerate:
```bash
node scripts/dump-database-schema.js
```

## License

[Your license here]