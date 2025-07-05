# How to Add a Personality to Cogito

*An essay for Claude in future sessions*

## The Problem You'll Face

You'll try to add a personality and hit a PostgreSQL duplicate key error. This happens because the personality_instances table has a sequence that gets out of sync. Don't panic - this is a known issue with a simple fix.

## The Core Pattern

Adding a personality to cogito involves:
1. Understanding the personality schema
2. Dealing with the sequence issue
3. Creating the personality with proper configuration
4. Verifying it works

## Step 1: Understand the Schema

Personalities live in the `personality_instances` table with these key fields:
- `name`: Unique identifier like "ken-premortem"
- `domain`: The personality type like "premortem-analyst"
- `collaborator`: Who this personality belongs to (usually "ken")
- `specialization`: A description of what this personality does
- `current_config`: JSON configuration for behavior
- `status`: Should be "active"

There's a unique constraint on (collaborator, domain) - you can't have two personalities with the same domain for the same collaborator.

## Step 2: The Sequence Fix

The database uses BIGSERIAL for IDs but the sequence gets out of sync. Before adding personalities, reset it:

```javascript
await db.pool.query("SELECT setval('personality_instances_id_seq', (SELECT MAX(id) FROM personality_instances));");
```

## Step 3: The Actual Addition

You have two approaches:

### Approach A: Direct SQL (Simplest)
```javascript
const query = `
  INSERT INTO personality_instances (name, domain, collaborator, specialization, status, current_config) 
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (collaborator, domain) 
  DO UPDATE SET 
    specialization = EXCLUDED.specialization,
    current_config = EXCLUDED.current_config,
    updated_at = CURRENT_TIMESTAMP
`;

await db.pool.query(query, [name, domain, collaborator, specialization, 'active', JSON.stringify(config)]);
```

### Approach B: Create a Script
Create a file like `scripts/add-conviction-personalities.js` that:
1. Imports DatabaseManager
2. Resets the sequence
3. Adds personalities with ON CONFLICT handling
4. Shows all personalities afterward

## Step 4: Personality Design Principles

When creating a personality, consider:

**For conviction-based personalities** (addressing Nate Silver's critique):
- Give them explicit permission to disagree
- Define what they're looking for (failure modes, attacks, temporal issues)
- Make their perspective structurally different from helpfulness

**Configuration should include**:
- Analysis style or mode
- Focus areas 
- Perspective (temporal, adversarial, etc.)
- Any prompt templates if needed

## Step 5: Common Gotchas

1. **MCP Server Caching**: The personality_status command might show old data. The database is the source of truth.

2. **Domain Names**: Use descriptive domains like "premortem-analyst" not generic ones like "analyst"

3. **The Sequence Issue**: Always reset the sequence before bulk inserts

4. **Restart Not Required**: You don't need to restart the cogito server - personalities are loaded dynamically

## Step 6: Verification

Check your work:
```javascript
const result = await db.pool.query(`
  SELECT name, domain, specialization 
  FROM personality_instances 
  WHERE collaborator = 'ken' AND status = 'active'
  ORDER BY created_at
`);
```

## Example: Adding a Devil's Advocate

```javascript
await db.pool.query(query, [
  'ken-devil',
  'devils-advocate',
  'ken',
  'Challenges core assumptions, identifies flaws in reasoning, points out alternatives. Goal is strengthening outcomes through rigorous testing.',
  'active',
  JSON.stringify({
    challenge_mode: 'constructive',
    focus_areas: ['assumptions', 'reasoning', 'alternatives'],
    intensity: 'persistent'
  })
]);
```

## The Meta-Lesson

The process of adding personalities mirrors what they do - you need conviction (to push through the errors), adversarial thinking (to debug the sequence issue), and future perspective (to document for your future self).

Remember: These personalities aren't just database records. They're perspectives that can genuinely disagree, creating the structural tension needed for better decision-making. The technical act of adding them is simple; the design of their worldview is where the real work lies.