# Backstage to Cogito Migration Plan

## Architecture Transformation

### Current Backstage Architecture
```
Multi-Schema PostgreSQL (per-client isolation)
├── public/participants (global users)
├── {client_schema}/groups (client-specific data)  
├── {client_schema}/grp_topic_avatar_turns (conversations)
├── {client_schema}/topic_paths (conversation threads)
├── {client_schema}/file_uploads (documents)
└── Pool-per-schema connection management
```

### Target Cogito Architecture  
```
Single Database with Schema Separation
├── client_mgmt/ (business logic)
├── conversation/ (blocks/turns/participants)
├── events/ (audit logging)
├── files/ (uploads/vectors)
└── client_id-based isolation
```

## Migration Strategy

### Phase 1: Schema Mapping

**Participants & Users:**
```sql
-- Backstage: public.participants + client isolation via schema
-- Cogito: conversation.participants + client_mgmt.users

backstage.participants → client_mgmt.users (auth info)
                      → conversation.participants (conversation persona)
```

**Groups & Organizations:**
```sql  
-- Backstage: {schema}.groups with rigid structure
-- Cogito: Metadata tags in blocks/participants

{schema}.groups → metadata in conversation.participants
{schema}.participant_groups → participant metadata tags
```

**Conversations:**
```sql
-- Backstage: {schema}.grp_topic_avatar_turns (topic-centric)
-- Cogito: conversation.blocks + conversation.turns (flexible)

{schema}.grp_topic_avatar_turns → conversation.turns
{schema}.topic_paths → conversation.blocks (one block per topic)
                   → block_turns linkage
```

**File Handling:**
```sql
-- Backstage: {schema}.file_uploads per client
-- Cogito: files.file_uploads with client_id

{schema}.file_uploads → files.file_uploads (+ client_id)
{schema}.file_upload_vectors → files.file_upload_vectors (+ client_id)
```

### Phase 2: Data Migration Scripts

**Script 1: Migrate Users & Participants**
```sql
-- Create users in client_mgmt
INSERT INTO client_mgmt.users (id, email, client_id, password_hash, metadata)
SELECT 
  gen_random_uuid(),
  email, 
  1, -- Map to appropriate client_id
  password,
  jsonb_build_object('migrated_from', 'backstage')
FROM public.participants;

-- Create conversation participants
INSERT INTO conversation.participants (user_id, name, type, metadata)
SELECT 
  u.id,
  p.name,
  'human',
  jsonb_build_object('client_id', u.client_id, 'migrated_from', 'backstage')
FROM public.participants p
JOIN client_mgmt.users u ON u.email = p.email;
```

**Script 2: Convert Conversations**
```javascript
// Pseudo-code for conversation migration
for each client_schema {
  // Create blocks for each unique topic
  const topics = await query(`SELECT DISTINCT topic_path FROM ${schema}.topic_paths`);
  
  for each topic {
    const block = await createBlock({
      name: topic.title,
      type: 'conversation',
      client_id: getClientId(schema),
      metadata: { original_topic_path: topic.path }
    });
    
    // Convert turns for this topic
    const turns = await query(`
      SELECT * FROM ${schema}.grp_topic_avatar_turns 
      WHERE topic_path = $1 ORDER BY created_at
    `, [topic.path]);
    
    for (turn of turns) {
      const newTurn = await createTurn({
        participant_id: getParticipantId(turn.participant_id),
        content: turn.content,
        source_type: turn.message_type,
        metadata: { original_turn_id: turn.id }
      });
      
      await linkTurnToBlock(block.id, newTurn.id);
    }
  }
}
```

### Phase 3: Application Code Updates

**Database Connection Changes:**
```javascript
// OLD: Multiple pools per schema
const pools = {
  'dev': new Pool({...}),
  'bsa': new Pool({...})
};

// NEW: Single cogito connection
const db = new DatabaseManager(); // Uses cogito connection
```

**Query Pattern Updates:**
```javascript
// OLD: Schema-specific queries
const result = await clientPool.query(`
  SELECT * FROM grp_topic_avatar_turns 
  WHERE topic_path = $1
`, [topicPath]);

// NEW: Blocks/turns with client_id filtering
const result = await db.pool.query(`
  SELECT t.*, b.name as block_name 
  FROM conversation.turns t
  JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
  JOIN conversation.blocks b ON bt.block_id = b.block_id
  WHERE b.metadata->>'client_id' = $1 
    AND b.metadata->>'original_topic_path' = $2
`, [clientId, topicPath]);
```

**Authentication Flow Updates:**
```javascript
// OLD: Schema pool assignment
req.clientPool = pools[schema];

// NEW: Client ID context
req.clientId = getClientIdFromSubdomain(req.hostname);
req.db = new DatabaseManager(); // Single connection
```

### Phase 4: Feature Enhancements

**Add Lens Analysis:**
```javascript
// New capability: Apply lens analysis to conversations
async function analyzeTopic(topicPath, clientId) {
  const block = await findBlockByTopicPath(topicPath, clientId);
  const genomeAnalysis = await applyLens(block.id, 'genome');
  const attractorAnalysis = await applyLens(block.id, 'attractor');
  
  return {
    traditional_view: block,
    genome: genomeAnalysis,
    attractor: attractorAnalysis
  };
}
```

**Participant Patterns:**
```javascript
// Enhanced: Store conversation patterns per participant
async function updateParticipantFromConversation(participantId, conversationInsights) {
  const patterns = await getParticipantPatterns(participantId);
  const updatedPatterns = mergeInsights(patterns, conversationInsights);
  
  await updateParticipantPatterns(participantId, updatedPatterns);
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Create cogito database schemas
- 🔄 Write migration scripts for core data
- 🔄 Update database connection configuration
- 🔄 Test basic CRUD operations

### Phase 2: Core Migration (Week 2)  
- 🔄 Migrate user/participant data
- 🔄 Convert conversations to blocks/turns
- 🔄 Update authentication flow
- 🔄 Test critical user journeys

### Phase 3: Feature Parity (Week 3)
- 🔄 Migrate file uploads system
- 🔄 Update group management
- 🔄 Test all existing features
- 🔄 Performance optimization

### Phase 4: Enhancement (Week 4)
- 🔄 Add lens analysis capabilities  
- 🔄 Implement participant patterns
- 🔄 Cross-conversation insights
- 🔄 Production deployment

## Benefits of Migration

**Architectural Improvements:**
- 🎯 **Cleaner schema separation** by responsibility
- 🎯 **Flexible blocks architecture** vs rigid topics
- 🎯 **Rich metadata capabilities** throughout
- 🎯 **Advanced analysis features** (lens system)

**Operational Benefits:**
- 🔧 **Simpler deployment** (single database)
- 🔧 **Better monitoring** (unified schema)
- 🔧 **Easier backups** (one database to manage)
- 🔧 **Standard authentication** (no schema switching)

**Feature Enhancements:**
- 🚀 **Cross-conversation patterns** 
- 🚀 **Deep conversation analysis** via lenses
- 🚀 **Participant intelligence** (pattern learning)
- 🚀 **Flexible conversation structures** (blocks vs topics)

The migration transforms backstage from a topic-centric multi-tenant system into a blocks-based conversation intelligence platform while preserving all existing functionality and adding powerful new analysis capabilities.