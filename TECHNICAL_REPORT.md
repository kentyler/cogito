# Cogito System Technical Report

## Executive Summary

Cogito is a multi-tenant conversational AI system built on Supabase that records, analyzes, and retrieves conversations between humans and AI assistants. The system supports pluggable LLMs, file uploads with vector embeddings, event tracking, and sophisticated conversation search capabilities.

## System Architecture

### Database: PostgreSQL on Supabase
- **Connection**: `postgresql://user:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
- **Extensions Required**: pgvector for similarity search
- **Multi-tenancy**: All tables include `client_id` for data isolation

### Core Components

1. **Identity Management**: Clients, Participants, Topics
2. **Conversation Storage**: conversation_turns with vector embeddings
3. **File Management**: File uploads with chunked vector search
4. **Event Tracking**: Comprehensive audit trail
5. **LLM Configuration**: Runtime-configurable AI models
6. **UI Customization**: Client-specific prompt buttons

## Database Schema

### 1. Identity Management

```sql
-- Clients (organizations/apps)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_llm_id INTEGER REFERENCES llms(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Participants (users/AI agents)
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    client_id INTEGER REFERENCES clients(id),
    current_llm_id INTEGER REFERENCES llms(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Topics (conversation subjects)
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_topic_id INTEGER REFERENCES topics(id),
    client_id INTEGER REFERENCES clients(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Conversation Storage

```sql
-- Main conversation storage with embeddings
CREATE TABLE conversation_turns (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    participant_id INTEGER NOT NULL REFERENCES participants(id),
    topic_id INTEGER REFERENCES topics(id),
    project_id INTEGER,
    session_id UUID,
    turn_index INTEGER NOT NULL,
    content_text TEXT NOT NULL,
    content_vector vector(1536),  -- OpenAI embedding
    interaction_type VARCHAR(50),
    llm_model VARCHAR(100),
    processing_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversation_turns_session ON conversation_turns(session_id, turn_index);
CREATE INDEX idx_conversation_turns_vector ON conversation_turns USING ivfflat (content_vector vector_cosine_ops);
```

### 3. File Upload System

```sql
-- File metadata
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    mime_type TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    public_url TEXT,
    bucket_name TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    description TEXT,
    tags TEXT[],
    client_id INTEGER NOT NULL REFERENCES clients(id)
);

-- File content chunks with vectors
CREATE TABLE file_upload_vectors (
    id SERIAL PRIMARY KEY,
    file_upload_id INTEGER REFERENCES file_uploads(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content_text TEXT NOT NULL,
    content_vector vector(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    client_id INTEGER NOT NULL,
    UNIQUE(file_upload_id, chunk_index)
);

-- File type definitions
CREATE TABLE file_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    client_id INTEGER NOT NULL REFERENCES clients(id)
);
```

### 4. Event Tracking

```sql
-- Event categories
CREATE TABLE participant_event_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    client_id INTEGER NOT NULL REFERENCES clients(id)
);

-- Event type definitions
CREATE TABLE participant_event_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    participant_event_categories_id BIGINT REFERENCES participant_event_categories(id),
    client_id INTEGER NOT NULL REFERENCES clients(id)
);

-- Simple event records
CREATE TABLE participant_events (
    id SERIAL PRIMARY KEY,
    participant_id BIGINT NOT NULL REFERENCES participants(id),
    event_type_id INTEGER NOT NULL REFERENCES participant_event_types(id),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    client_id INTEGER NOT NULL REFERENCES clients(id)
);

-- Detailed event logs with audit info
CREATE TABLE participant_event_logs (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id),
    event_type_id INTEGER REFERENCES participant_event_types(id),
    description TEXT,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    client_id INTEGER NOT NULL REFERENCES clients(id)
);
```

### 5. LLM Configuration

```sql
-- LLM provider types
CREATE TABLE llm_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    api_handler VARCHAR(100) NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id)
);

-- LLM configurations
CREATE TABLE llms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    temperature DOUBLE PRECISION DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    type_id INTEGER REFERENCES llm_types(id),
    additional_config JSONB,
    client_id INTEGER NOT NULL REFERENCES clients(id)
);

-- Junction tables for many-to-many relationships
CREATE TABLE client_llms (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id),
    llm_id BIGINT NOT NULL REFERENCES llms(id),
    UNIQUE(client_id, llm_id)
);

CREATE TABLE participant_llms (
    id BIGSERIAL PRIMARY KEY,
    participant_id BIGINT NOT NULL REFERENCES participants(id),
    llm_id INTEGER NOT NULL REFERENCES llms(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    UNIQUE(participant_id, llm_id)
);
```

### 6. UI Configuration

```sql
-- Client-specific prompt buttons
CREATE TABLE client_prompts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    prompt_text TEXT NOT NULL,
    label_text VARCHAR(100) NOT NULL,
    display_order FLOAT NOT NULL,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Supabase Edge Functions

### 1. File Management

#### `/functions/v1/file-upload`
Handles multipart file uploads, stores in Supabase Storage, creates database record, triggers background vectorization.

**Request:**
```typescript
FormData: {
  file: File,
  clientId?: number,
  description?: string,
  tags?: string[],
  skipVectorization?: boolean
}
```

#### `/functions/v1/file-vectorize`
Background process that chunks text files and generates OpenAI embeddings.

**Request:**
```json
{
  "fileId": 123,
  "filePath": "uploads/file.txt",
  "mimeType": "text/plain",
  "clientId": 6
}
```

#### `/functions/v1/file-search`
Searches file content using vector similarity or text search fallback.

**Request:**
```json
{
  "query": "search terms",
  "clientId": 6,
  "limit": 10
}
```

#### `/functions/v1/file-delete`
Removes file from storage and database.

**Request:**
```json
{
  "fileId": 123,
  "clientId": 6
}
```

### 2. Event Tracking

#### `/functions/v1/log-event`
Flexible event logging with multiple event types.

**Event Types:**
- `conversation_turn`: Log prompts/responses
- `file_operation`: Log file uploads/deletes
- `search`: Log search queries with metrics
- `button_click`: Log UI interactions
- `detailed_log`: Full logging with IP/user agent
- `simple_event`: Direct event creation

**Example Request:**
```json
{
  "eventType": "conversation_turn",
  "eventData": {
    "participantId": 3,
    "sessionId": "uuid",
    "interactionType": "human_input",
    "content": "Hello, how are you?"
  }
}
```

#### `/functions/v1/get-events`
Retrieves events with various query types.

**Query Types:**
- `participant_events`: Events for specific participant
- `event_logs`: Detailed logs with filtering
- `event_summary`: Event counts by type
- `recent_activity`: Recent events across system

**Example Request:**
```json
{
  "queryType": "participant_events",
  "params": {
    "participantId": 3,
    "limit": 50,
    "eventTypeId": 1
  }
}
```

### 3. LLM Configuration

#### `/functions/v1/get-llm-config`
Retrieves LLM configuration with inheritance support.

**Entity Types:**
- `client`: Get client's current LLM
- `participant`: Get participant's LLM (with client fallback)
- `available`: List all LLMs for a client

**Example Request:**
```json
{
  "entityType": "participant",
  "entityId": 3
}
```

#### `/functions/v1/update-llm-config`
Updates LLM configurations and assignments.

**Actions:**
- `set_client_llm`: Assign LLM to client
- `set_participant_llm`: Assign LLM to participant
- `clear_participant_llm`: Reset to inherit from client
- `create_llm`: Add new LLM configuration
- `update_llm`: Modify existing LLM

**Example Request:**
```json
{
  "action": "set_participant_llm",
  "data": {
    "participantId": 3,
    "llmId": 1
  }
}
```

## Key Design Patterns

### 1. Multi-Tenancy
Every table includes `client_id` for complete data isolation. This allows multiple organizations to use the same database without data leakage.

### 2. Inheritance Hierarchy
LLM configuration follows: Participant → Client → System Default

### 3. Vector Search
All text content (conversations and files) is embedded using OpenAI's text-embedding-3-small model for semantic search capabilities.

### 4. Flexible Event System
Events can be logged at two levels:
- Simple events for basic tracking
- Detailed logs for comprehensive audit trails

### 5. Session Management
Sessions are tracked via UUID in conversation_turns without requiring separate session tables, keeping the system stateless.

## Local Development Tools

### ClaudeCodeRecorder
Records Claude Code conversations directly to the database:

```javascript
import { ClaudeCodeRecorder } from './lib/claude-code-recorder.js';

const recorder = new ClaudeCodeRecorder();
await recorder.recordConversationPair({
  sessionId: 'uuid',
  projectId: 123,
  humanPrompt: "User's question",
  claudeResponse: "Claude's answer",
  llmModel: 'claude-3-5-sonnet'
});
```

## Setup Instructions

### 1. Database Setup
```bash
# Create tables in order due to foreign key constraints
psql $DATABASE_URL -f create_identity_tables.sql
psql $DATABASE_URL -f create_conversation_tables.sql
psql $DATABASE_URL -f create_file_upload_tables.sql
psql $DATABASE_URL -f create_event_tracking_tables.sql
psql $DATABASE_URL -f create_llm_tables.sql
psql $DATABASE_URL -f create_client_prompts_table.sql
```

### 2. Supabase Functions Deployment
```bash
# Login to Supabase CLI
supabase login --token YOUR_TOKEN

# Link to project
supabase link --project-ref hpdbaeurycyhqigiatco

# Deploy all functions
supabase functions deploy file-upload
supabase functions deploy file-vectorize
supabase functions deploy file-search
supabase functions deploy file-delete
supabase functions deploy log-event
supabase functions deploy get-events
supabase functions deploy get-llm-config
supabase functions deploy update-llm-config

# Set environment variables
supabase secrets set OPENAI_API_KEY=your_key
```

### 3. Storage Setup
Create a public bucket named "files" in Supabase Storage dashboard.

### 4. Initial Data
The SQL scripts include default data for:
- Cogito client (id=6)
- Event categories and types
- LLM types and configurations
- Sample prompt buttons

## Security Considerations

1. **API Keys**: Store in environment variables, never in code
2. **Row Level Security**: Consider enabling RLS on tables
3. **Client Isolation**: Always filter by client_id
4. **Edge Function Auth**: Functions use service role key for full access

## Future Enhancements

1. **PDF Processing**: Add PDF text extraction to file vectorization
2. **Real-time Updates**: Use Supabase Realtime for live conversations
3. **Advanced Analytics**: Build on event tracking for usage insights
4. **Session Management**: Add if complex session tracking needed
5. **Conversation Branching**: Support for conversation trees

## Conclusion

Cogito provides a complete platform for AI conversation management with:
- Flexible multi-tenant architecture
- Semantic search capabilities
- Pluggable LLM support
- Comprehensive event tracking
- File processing with vector search

The system is designed for extensibility and can be enhanced with additional features as needed.