# Backstage to Cogito Integration Analysis

## Overview
Analysis of integrating the Backstage project database into Cogito's database architecture.

## Backstage Database Schema (public schema only)

### Core Tables
1. **participants** - User/participant management
2. **groups** - Group organization
3. **group_types** - Types of groups
4. **grp_con_types** - Group connection types
5. **llms** - LLM configurations
6. **llm_types** - Types of LLMs
7. **session** - Session management
8. **participant_roles** - Role assignments
9. **participant_event_types** - Event type definitions
10. **avatar_event_types** - Avatar-related events
11. **message_types** - Message categorization
12. **turn_kinds** - Types of conversational turns
13. **turn_relationship_types** - How turns relate
14. **file_types** - File categorization
15. **preference_types** - User preference categories

## Cogito Database Schema (current state after migration 006)

### Core Tables
1. **participants** - Already exists (need to check structure)
2. **turns** - Conversational turns (migrated from conversation_turns)
3. **blocks** - Flexible grouping of turns (sessions, meetings, threads)
4. **block_turns** - Many-to-many relationship
5. **lens_prototypes** - Analysis templates
6. **block_lens_version** - Applied analyses

### Legacy Tables (from older migrations)
- personality_instances
- personality_evolutions
- public_interactions
- internal_deliberations
- coordination_events
- discussion_openings
- evaporation_patterns
- instance_insights

## Integration Points

### Direct Overlaps
1. **participants table** - Both systems have this
   - Need to merge/reconcile participant data
   - Check for schema differences

2. **Session concept** - Different implementations
   - Backstage: `session` table
   - Cogito: Sessions are now `blocks` with type='session'

### Complementary Features
1. **LLM Management**
   - Backstage has `llms` and `llm_types` tables
   - Cogito doesn't have explicit LLM configuration
   - Could enhance Cogito with LLM management

2. **Turn Management**
   - Backstage: `turn_kinds`, `turn_relationship_types`
   - Cogito: `turns` table with relationships via blocks
   - Can enrich Cogito's turn metadata

3. **Group/Role Management**
   - Backstage: `groups`, `group_types`, `participant_roles`
   - Cogito: No explicit group management
   - Could add collaborative features to Cogito

## Potential Conflicts

1. **Participant Schema**
   - Need to verify column compatibility
   - May need to merge or extend fields

2. **Session Management Philosophy**
   - Backstage: Traditional session table
   - Cogito: Flexible blocks architecture
   - Need migration strategy

3. **Message/Turn Structure**
   - Different approaches to storing conversational data
   - Need to map Backstage messages to Cogito turns

## Migration Strategy

### Phase 1: Schema Analysis
1. Compare participant table structures
2. Map Backstage concepts to Cogito blocks
3. Identify data transformation needs

### Phase 2: Integration Design
1. Extend Cogito schema with useful Backstage features:
   - LLM management tables
   - Group/role management
   - Enhanced turn metadata

2. Create migration scripts:
   - Participant data merge
   - Session → Block conversion
   - Turn/message mapping

### Phase 3: Implementation
1. Add new tables to Cogito
2. Migrate existing Backstage data
3. Update helper functions

## Recommendations

1. **Yes, integration is feasible** - The databases are complementary
2. **Preserve Cogito's flexible architecture** - Use blocks, not rigid sessions
3. **Adopt Backstage's LLM management** - Useful feature to add
4. **Extend participant model** - Merge best of both schemas
5. **Keep historical data** - Archive Backstage structure for reference

## Next Steps

1. Get detailed participant table schema from both databases
2. Design merged participant structure
3. Create migration scripts for data movement
4. Test integration with sample data
5. Plan phased rollout