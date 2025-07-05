-- Migration 006: Conversation to Blocks Architecture
-- Migrates from conversation-based model to flexible blocks model
-- Date: 2025-06-28

BEGIN;

-- =====================================================================
-- PART 1: CREATE NEW TABLES
-- =====================================================================

-- Core turns table (simplified from conversation_turns)
CREATE TABLE IF NOT EXISTS turns (
  turn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id BIGINT REFERENCES participants(id),
  content TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_type VARCHAR(50), -- 'claude_code', 'email', 'slack', 'zoom', 'manual'
  source_turn_id VARCHAR(255), -- original identifier in source system
  metadata JSONB DEFAULT '{}'
);

-- Flexible blocks table
CREATE TABLE IF NOT EXISTS blocks (
  block_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255), -- optional human-readable name
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255), -- who/what created this block
  block_type VARCHAR(50), -- 'session', 'meeting', 'thread', 'custom', etc.
  metadata JSONB DEFAULT '{}'
);

-- Many-to-many relationship between blocks and turns
CREATE TABLE IF NOT EXISTS block_turns (
  block_id UUID REFERENCES blocks(block_id) ON DELETE CASCADE,
  turn_id UUID REFERENCES turns(turn_id) ON DELETE CASCADE,
  sequence_order INTEGER, -- order within this block
  PRIMARY KEY (block_id, turn_id)
);

-- Lens prototypes (templates for analysis)
CREATE TABLE IF NOT EXISTS lens_prototypes (
  prototype_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 'genome', 'attractor', 'thread', 'crystal'
  description TEXT,
  base_prompt TEXT NOT NULL, -- the canonical instruction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Individual applications of lenses to blocks
CREATE TABLE IF NOT EXISTS block_lens_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES blocks(block_id) ON DELETE CASCADE,
  lens_prototype_id UUID REFERENCES lens_prototypes(prototype_id),
  applied_prompt TEXT NOT NULL, -- copy of prototype + any customizations
  lens_result TEXT, -- the full text analysis from the LLM
  lens_embedding VECTOR(1536), -- embedding of the lens_result for similarity search
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by VARCHAR(255),
  notes TEXT -- why this specific application/customization
);

-- =====================================================================
-- PART 2: CREATE INDEXES
-- =====================================================================

-- Turns indexes
CREATE INDEX IF NOT EXISTS idx_turns_participant ON turns(participant_id);
CREATE INDEX IF NOT EXISTS idx_turns_timestamp ON turns(timestamp);
CREATE INDEX IF NOT EXISTS idx_turns_source_type ON turns(source_type);
CREATE INDEX IF NOT EXISTS idx_turns_source_turn_id ON turns(source_type, source_turn_id);

-- Blocks indexes
CREATE INDEX IF NOT EXISTS idx_blocks_created_at ON blocks(created_at);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_blocks_created_by ON blocks(created_by);

-- Block_turns indexes
CREATE INDEX IF NOT EXISTS idx_block_turns_block ON block_turns(block_id);
CREATE INDEX IF NOT EXISTS idx_block_turns_turn ON block_turns(turn_id);
CREATE INDEX IF NOT EXISTS idx_block_turns_sequence ON block_turns(block_id, sequence_order);

-- Lens indexes
CREATE INDEX IF NOT EXISTS idx_lens_prototypes_name ON lens_prototypes(name);
CREATE INDEX IF NOT EXISTS idx_block_lens_version_block ON block_lens_version(block_id);
CREATE INDEX IF NOT EXISTS idx_block_lens_version_prototype ON block_lens_version(lens_prototype_id);
CREATE INDEX IF NOT EXISTS idx_block_lens_version_created_at ON block_lens_version(created_at);

-- =====================================================================
-- PART 3: MIGRATE EXISTING DATA
-- =====================================================================

-- Migrate conversation_turns to turns table
INSERT INTO turns (
  turn_id,
  participant_id,
  content,
  timestamp,
  source_type,
  source_turn_id,
  metadata
)
SELECT 
  gen_random_uuid(),
  participant_id,
  content_text,
  COALESCE(created_at, NOW()),
  COALESCE(interaction_type, 'unknown'),
  id::text, -- use old ID as source reference
  COALESCE(processing_metadata, '{}')
FROM conversation_turns
WHERE conversation_turns.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create blocks for each unique session_id from conversation_turns
INSERT INTO blocks (
  block_id,
  name,
  description,
  created_at,
  created_by,
  block_type,
  metadata
)
SELECT DISTINCT
  gen_random_uuid(),
  'Session: ' || session_id,
  'Migrated from conversation_turns session',
  MIN(COALESCE(created_at, NOW())),
  'migration_script',
  'session',
  jsonb_build_object('original_session_id', session_id, 'migrated_from', 'conversation_turns')
FROM conversation_turns
WHERE session_id IS NOT NULL
GROUP BY session_id
ON CONFLICT DO NOTHING;

-- Link turns to blocks via block_turns
WITH session_blocks AS (
  SELECT 
    block_id,
    metadata->>'original_session_id' as session_id
  FROM blocks 
  WHERE block_type = 'session' 
    AND metadata->>'migrated_from' = 'conversation_turns'
),
migrated_turns AS (
  SELECT 
    t.turn_id,
    ct.session_id,
    ROW_NUMBER() OVER (PARTITION BY ct.session_id ORDER BY COALESCE(ct.turn_index, ct.id)) as sequence_order
  FROM turns t
  JOIN conversation_turns ct ON t.source_turn_id = ct.id::text
  WHERE t.source_type IN ('human_input', 'ai_response', 'unknown')
)
INSERT INTO block_turns (block_id, turn_id, sequence_order)
SELECT 
  sb.block_id,
  mt.turn_id,
  mt.sequence_order
FROM session_blocks sb
JOIN migrated_turns mt ON sb.session_id = mt.session_id
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PART 4: INSERT INITIAL LENS PROTOTYPES
-- =====================================================================

INSERT INTO lens_prototypes (prototype_id, name, description, base_prompt, created_by) VALUES 
(
  gen_random_uuid(),
  'genome',
  'Captures the DNA of the conversation - core rules and patterns that generated it',
  'Analyze this exchange block and generate a "conversation genome" containing:

- Axioms: Core shared beliefs/assumptions that made the conversation possible
- Operators: Types of conversational moves with pattern → transformation examples 
  (e.g., "challenge_assumption → new_perspective", "request_clarification → deeper_understanding")
- Constraints: What limited or shaped the discussion (technical, social, conceptual, time)
- Attractors: Topics/themes that repeatedly drew focus
- Void_maps: What wasn''t discussed but shaped conversation through absence
- Generative_rules: If-then patterns that drove the conversation forward

Enhanced requirements:
- Include emotional/energy markers for key realizations (0.0-1.0 scale)
- Capture interaction dynamics between participants (building/blocking/redirecting)
- Note which concepts received deep exploration vs. surface treatment
- Mark theoretical frameworks explicitly invoked
- Indicate where concrete artifacts (code, documents, plans) were created
- Track participant stance evolution (skeptical→convinced, confused→clear)

Output as structured JSON. The genome should enable reconstruction of not just what was discussed, but HOW participants thought together.',
  'migration_script'
),
(
  gen_random_uuid(),
  'attractor',
  'Maps the journey through idea-space - how conversation moved and evolved',
  'Map this exchange block as a "strange attractor" in possibility space:

- Initial_conditions: 
  - Starting context and constraints
  - Energy state (low/building/high)
  - Participant stances and expertise levels
  - Triggering question or problem
  
- Attractor_topology:
  - Dimensions of movement (technical↔philosophical, abstract↔concrete, problem↔solution)
  - Shape of explored space (linear, circular, spiral, chaotic)
  - Strange loops and recursive returns
  
- Trajectory_samples: Array of key moments showing:
  - time: normalized 0.0 to 1.0
  - position: where in idea space
  - velocity: rate of progress/exploration  
  - energy: engagement/excitement level
  - density: how thoroughly area was explored
  
- Bifurcation_points: Where conversation could have gone differently
  - moment: what choice point
  - taken_path: what was chosen
  - shadow_paths: what wasn''t explored
  - energy_cost: effort to stay on chosen path

Enhanced requirements:
- Add phenomenological_markers: How key moments felt (breakthrough, confusion, alignment)
- Include conceptual_density_map: Which areas got rich exploration vs. quick passes
- Mark artifact_generation_points: When concrete outputs were created
- Track energy_cascade_moments: When excitement propagated between participants
- Note resolution_quality: How well initial questions were answered

Output as structured JSON capturing both trajectory (where conversation went) and texture (how it felt).',
  'migration_script'
),
(
  gen_random_uuid(),
  'thread',
  'Shows how multiple interpretations coexisted without premature collapse',
  'Analyze how multiple conceptual threads coexisted in this exchange:

- Active_threads: Array of concurrent interpretation lines
  - thread_id: unique identifier
  - content: what this thread explores
  - lifecycle: emerged → developed → {resolved|suspended|merged|dropped}
  - participants: who carried this thread
  - energy_profile: attention this thread received over time
  
- Thread_interactions:
  - Reinforcement: threads that strengthened each other
  - Tension: threads in productive conflict
  - Synthesis: where threads merged into new understanding
  - Branching: where one thread split into multiple
  
- Underground_currents: Implicit threads that influenced without direct expression
  - Shadow_conversations: what participants thought but didn''t say
  - Meta_threads: conversations about the conversation
  - Assumption_threads: unexamined beliefs shaping discussion
  
- Collapse_resistance: How conversation maintained multiplicity
  - Suspension_techniques: "let''s hold that thought"
  - Both_and_moves: avoiding false dichotomies
  - Complexity_maintenance: keeping difficult ideas unresolved

Enhanced requirements:
- Track thread_health: which threads got full exploration vs. premature closure
- Note thread_ownership: shared vs. individual champion
- Mark synthesis_quality: how well threads integrated vs. remaining separate
- Include thread_artifacts: what each thread produced concretely
- Measure cognitive_load: how many threads could be active simultaneously

Output as structured JSON showing the conversation''s capacity for parallel processing.',
  'migration_script'
),
(
  gen_random_uuid(),
  'crystal',
  'Represents exchange as simultaneous structure rather than sequence',
  'Represent this exchange as a crystalline structure viewed simultaneously:

- Seed_points: Initial concepts that grew into larger structures
  - Core_questions: what initiated growth
  - Generative_concepts: ideas that spawned others
  - Catalyst_moments: what accelerated crystallization
  
- Symmetries: Repeated patterns at different scales
  - Micro_patterns: within single exchanges
  - Meso_patterns: across topic segments  
  - Macro_patterns: throughout entire conversation
  - Self_similarity: where patterns repeated fractally
  
- Facets: Different faces/perspectives of the same whole
  - Technical_facet: implementation details
  - Philosophical_facet: underlying principles
  - Practical_facet: real-world applications
  - Experiential_facet: how it felt to participants
  
- Interference_patterns: Where different growth patterns met
  - Constructive: reinforcing intersections
  - Destructive: canceling intersections
  - Moiré_effects: new patterns from overlaps

- Crystallographic_properties:
  - Clarity: how well-defined vs. cloudy
  - Hardness: resistance to challenge
  - Cleavage_planes: natural breaking points
  - Color/frequency: dominant emotional tone

Enhanced requirements:
- Include defects_and_inclusions: where pattern breaks provided insight
- Map resonance_structures: ideas that vibrated together
- Note growth_conditions: what enabled this particular formation
- Track phase_transitions: when conversation fundamentally restructured
- Measure coherence_score: how well structure holds together

Output as structured JSON representing the conversation''s simultaneous wholeness.',
  'migration_script'
)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PART 5: CREATE VIEWS FOR COMPATIBILITY
-- =====================================================================

-- View to help with transition - shows blocks that look like sessions
CREATE OR REPLACE VIEW session_blocks AS
SELECT 
  b.block_id,
  b.metadata->>'original_session_id' as session_id,
  b.name,
  b.created_at,
  COUNT(bt.turn_id) as turn_count
FROM blocks b
LEFT JOIN block_turns bt ON b.block_id = bt.block_id
WHERE b.block_type = 'session'
GROUP BY b.block_id, b.metadata->>'original_session_id', b.name, b.created_at;

-- View to show turn details within blocks
CREATE OR REPLACE VIEW block_turn_details AS
SELECT 
  b.block_id,
  b.name as block_name,
  b.block_type,
  t.turn_id,
  t.participant_id,
  p.name as participant_name,
  t.content,
  t.timestamp,
  bt.sequence_order,
  t.source_type,
  t.metadata as turn_metadata
FROM blocks b
JOIN block_turns bt ON b.block_id = bt.block_id
JOIN turns t ON bt.turn_id = t.turn_id
LEFT JOIN participants p ON t.participant_id = p.id
ORDER BY b.created_at, bt.sequence_order;

COMMIT;

-- =====================================================================
-- NOTES FOR NEXT STEPS
-- =====================================================================

-- After this migration:
-- 1. Update application code to use turns/blocks instead of conversation_turns
-- 2. Test that all existing data is properly migrated
-- 3. Remove conversation tables when confident in new structure
-- 4. Implement lens analysis functionality
-- 5. Create tools for creating and managing blocks