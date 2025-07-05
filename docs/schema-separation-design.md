# Schema Separation Design for Cogito

## Conceptual Model

### Two Distinct Domains

**Schema: `client_mgmt` (Authorization/Payment)**
```
clients (billing, settings)
├── client_users (membership, roles, permissions)
├── projects (workspaces within client)
├── llm_configs (client's LLM settings)
└── prompts (client's custom prompts)
```

**Schema: `conversation` (Participation/Content)**
```
participants (avatars/personas for interaction)
├── turns (individual messages/content)
├── blocks (groupings of turns)
├── patterns (analysis data)
└── lens_data (conversation analysis)
```

### Key Insight: Users vs Participants

**User** = Account holder (auth, billing, client membership)
**Participant** = Avatar/persona in conversations (patterns, communication style)

### Cross-Schema Relationships

```sql
-- A user can participate across multiple clients
users (in client_mgmt) → participants (in conversation) 
  [1:many - user can have multiple personas/participants]

-- Conversations are scoped to projects/clients
projects (in client_mgmt) ← blocks (in conversation)
  [1:many - project contains multiple conversation blocks]

-- LLM configs apply to project conversations
llm_configs (in client_mgmt) ← blocks/turns (in conversation)
  [1:many - config used for multiple conversations]
```

## Proposed Schema Structure

### Schema: `client_mgmt`
```sql
-- Core business entities
clients (id, name, billing_info, settings)
users (id, email, auth_info, created_at) 
client_users (client_id, user_id, role, permissions)
projects (id, client_id, name, settings)

-- Client configurations  
llm_configs (id, client_id, provider, model, settings)
prompts (id, client_id, name, template, variables)
```

### Schema: `conversation`
```sql
-- Conversation entities
participants (id, user_id, name, type, patterns_metadata)
blocks (id, project_id, name, type, metadata)
turns (id, participant_id, content, timestamp, metadata)
block_turns (block_id, turn_id, sequence_order)

-- Analysis data
lens_prototypes (id, name, prompt_template)
block_lens_version (id, block_id, lens_id, result, embedding)
```

### Cross-Schema Views
```sql
-- Convenience views that join across schemas
CREATE VIEW participant_users AS
SELECT 
  p.*,
  u.email,
  u.auth_info,
  array_agg(DISTINCT c.name) as client_names
FROM conversation.participants p
JOIN client_mgmt.users u ON p.user_id = u.id
JOIN client_mgmt.client_users cu ON u.id = cu.user_id  
JOIN client_mgmt.clients c ON cu.client_id = c.id
GROUP BY p.id, u.id;

CREATE VIEW project_blocks AS
SELECT 
  b.*,
  pr.name as project_name,
  c.name as client_name
FROM conversation.blocks b
JOIN client_mgmt.projects pr ON b.project_id = pr.id
JOIN client_mgmt.clients c ON pr.client_id = c.id;
```

## Migration Benefits

1. **Clear separation of concerns**
   - `client_mgmt`: Business logic, auth, billing
   - `conversation`: Content, analysis, patterns

2. **Flexible user model**
   - Users can participate in multiple clients
   - Multiple participants per user (different personas)

3. **Better security boundaries**
   - Auth tables isolated from conversation data
   - Different access patterns for different schemas

4. **Scalability options**
   - Could eventually split schemas to different databases
   - Different backup/replication strategies per schema

## Implementation Questions

1. **Participant scoping**: Should participants be:
   - Global (can participate across any project they have access to)
   - Project-scoped (separate participant per project)
   - Client-scoped (separate participant per client)

2. **Project vs Client scoping**: Should blocks reference:
   - `project_id` (more granular)
   - `client_id` (simpler)

3. **Migration strategy**: 
   - Big bang schema move
   - Gradual table-by-table migration

## Recommended Next Steps

1. Audit current `user_id`/`client_id` foreign keys
2. Design the user → participant relationship mapping
3. Create migration scripts for schema separation
4. Update application code to use schema-prefixed queries
5. Add cross-schema views for common queries

This separation would create a much cleaner architecture that supports the multi-client user model while keeping conversation data properly isolated.