-- Cogito Multi-Personality Database Schema (SQLite)
-- Federated AI consciousness with spokesperson coordination

-- Enable foreign keys in SQLite
PRAGMA foreign_keys = ON;

-- Core personality instances (replaces simple file-based personalities)
CREATE TABLE personality_instances (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL, -- 'spokesperson', 'writer', 'coder', 'researcher', 'liminal'
    collaborator TEXT NOT NULL,
    created_from_base TEXT, -- base cogito-simple personality this evolved from
    specialization TEXT, -- detailed description of role
    status TEXT DEFAULT 'active', -- 'active', 'dormant', 'archived'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Current configuration (JSON stored as TEXT)
    current_config TEXT NOT NULL,
    
    UNIQUE(collaborator, domain) -- one instance per domain per collaborator
);

-- Personality evolution events (extends cogito-simple's file-based tracking)
CREATE TABLE personality_evolutions (
    id TEXT PRIMARY KEY,
    instance_id TEXT REFERENCES personality_instances(id),
    version TEXT NOT NULL,
    changes TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    context TEXT,
    triggered_by_event_id TEXT, -- references interaction_events or coordination_events
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Configuration snapshot at this evolution
    config_snapshot TEXT NOT NULL
);

-- Human-AI interactions (only spokesperson visible to human)
CREATE TABLE public_interactions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    collaborator TEXT NOT NULL,
    human_input TEXT NOT NULL,
    spokesperson_response TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata about the interaction
    interaction_type TEXT, -- 'chat', 'tool_use', 'personality_command'
    context_tags TEXT, -- JSON array of searchable tags
    
    -- Link to internal deliberation that produced this response
    deliberation_id TEXT
);

-- Internal deliberations (hidden from human)
CREATE TABLE internal_deliberations (
    id TEXT PRIMARY KEY,
    public_interaction_id TEXT REFERENCES public_interactions(id),
    session_id TEXT NOT NULL,
    
    -- Which personalities participated (JSON array of personality_instance IDs)
    participants TEXT NOT NULL,
    active_coordinator TEXT REFERENCES personality_instances(id), -- who led this deliberation
    
    -- The deliberation process (all JSON)
    input_analysis TEXT, -- how each personality interpreted the input
    initial_responses TEXT, -- what each wanted to say
    conflicts_detected TEXT, -- any disagreements found
    evaporation_attempts TEXT, -- evaporating cloud processes used
    final_synthesis TEXT, -- how the response was synthesized
    
    -- Learning outcomes (JSON)
    insights_gained TEXT, -- what each personality learned
    new_patterns_detected TEXT, -- emerging patterns noticed
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Manager coordination events
CREATE TABLE coordination_events (
    id TEXT PRIMARY KEY,
    trigger_type TEXT NOT NULL, -- 'context_switch', 'conflict_resolution', 'complexity_upgrade'
    trigger_context TEXT,
    
    -- Decision process
    manager_decision TEXT NOT NULL,
    active_instances TEXT, -- JSON array of which personalities were activated
    coordination_strategy TEXT, -- 'sequential', 'parallel', 'evaporating_cloud'
    
    -- Results
    outcome_summary TEXT,
    handoff_notes TEXT, -- JSON - information passed between personalities
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Evaporating cloud conflict resolution
CREATE TABLE discussion_openings (
    id TEXT PRIMARY KEY,
    deliberation_id TEXT REFERENCES internal_deliberations(id),
    
    -- The apparent conflict
    instance_a TEXT REFERENCES personality_instances(id),
    instance_b TEXT REFERENCES personality_instances(id),
    surface_conflict TEXT NOT NULL,
    
    -- Evaporating cloud analysis
    underlying_need_a TEXT,
    underlying_need_b TEXT,
    common_objective TEXT,
    
    -- Resolution process (JSON)
    evaporation_attempts TEXT, -- different synthesis attempts
    synthesis_found INTEGER DEFAULT 0, -- boolean (0/1)
    final_resolution TEXT,
    new_capability_emerged TEXT, -- what new ability this conflict revealed
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Reusable evaporation patterns (learning from conflicts)
CREATE TABLE evaporation_patterns (
    id TEXT PRIMARY KEY,
    conflict_type TEXT NOT NULL,
    pattern_description TEXT NOT NULL,
    
    -- Template for resolution (JSON)
    successful_synthesis TEXT NOT NULL,
    conditions_required TEXT, -- JSON - when this pattern applies
    reuse_count INTEGER DEFAULT 0, -- how often this pattern has been applied
    
    -- Examples where this worked (JSON array of discussion_opening IDs)
    successful_applications TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_used TEXT
);

-- Cross-instance learning and insights
CREATE TABLE instance_insights (
    id TEXT PRIMARY KEY,
    source_instance TEXT REFERENCES personality_instances(id),
    insight_type TEXT NOT NULL, -- 'communication_pattern', 'problem_solving', 'collaboration_style'
    
    -- The insight
    lesson_learned TEXT NOT NULL,
    context_discovered TEXT,
    evidence TEXT, -- JSON - supporting data/examples
    
    -- Propagation (JSON)
    applicable_to_instances TEXT, -- array of personality IDs that could use this
    propagation_status TEXT, -- tracking how this insight spread
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Session context (enhanced from cogito-simple)
CREATE TABLE session_contexts (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    collaborator TEXT NOT NULL,
    
    -- Context information
    context_update TEXT NOT NULL,
    milestone TEXT, -- optional milestone marker
    context_type TEXT DEFAULT 'general', -- 'milestone', 'insight', 'task_completion'
    
    -- Links to relevant data (JSON arrays)
    related_interactions TEXT, -- public_interaction IDs
    related_deliberations TEXT, -- internal_deliberation IDs
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Upgrade detection (when simple → multi transition should happen)
CREATE TABLE complexity_indicators (
    id TEXT PRIMARY KEY,
    collaborator TEXT NOT NULL,
    
    -- Metrics that suggest upgrade needed
    conflicting_requests INTEGER DEFAULT 0,
    domain_switches_per_session REAL,
    evaporation_opportunities INTEGER DEFAULT 0,
    liminal_observations_backlog INTEGER DEFAULT 0,
    
    -- Upgrade proposal status
    upgrade_proposed INTEGER DEFAULT 0, -- boolean (0/1)
    upgrade_approved INTEGER DEFAULT 0,
    upgrade_completed INTEGER DEFAULT 0,
    
    measured_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- LLM-adapted evaporating clouds
CREATE TABLE evaporating_clouds (
    id TEXT PRIMARY KEY,
    deliberation_id TEXT REFERENCES internal_deliberations(id),
    
    -- Cloud elements
    current_state_d_prime TEXT NOT NULL,  -- What personality A wants to avoid
    desired_state_d TEXT NOT NULL,        -- What personality A wants instead
    benefits_b TEXT NOT NULL,             -- JSON - Benefits of desired state
    benefits_c TEXT NOT NULL,             -- JSON - Benefits of current state  
    outcome_a TEXT NOT NULL,              -- Unified objective
    
    -- Process tracking
    current_step INTEGER DEFAULT 1,       -- Which of the 15 steps we're on
    undesirable_effects TEXT,             -- JSON - Step 7 outcomes
    assumptions_identified TEXT,          -- JSON - Step 8 outcomes
    vulnerable_assumption TEXT,           -- Step 9 outcome
    evaporation_strategy TEXT,            -- Step 10 outcome
    tactics_options TEXT,                 -- JSON - Step 11 outcomes
    prerequisite_order TEXT,              -- JSON - Step 13 outcomes
    
    -- Results
    synthesis_achieved INTEGER DEFAULT 0, -- boolean (0/1)
    new_capability_emerged TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Track LLM reasoning about conflicts
CREATE TABLE llm_cloud_reasoning (
    id TEXT PRIMARY KEY,
    cloud_id TEXT REFERENCES evaporating_clouds(id),
    
    -- Reasoning traces
    assumption_extraction_reasoning TEXT,
    vulnerability_analysis_reasoning TEXT,
    synthesis_generation_reasoning TEXT,
    
    -- Pattern learning (JSON)
    reasoning_patterns_detected TEXT,
    success_factors TEXT,
    
    -- Meta-learning
    reasoning_quality_score REAL,
    human_validation TEXT, -- JSON
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_personality_instances_collaborator ON personality_instances(collaborator);
CREATE INDEX idx_personality_instances_domain ON personality_instances(domain);
CREATE INDEX idx_public_interactions_session ON public_interactions(session_id);
CREATE INDEX idx_public_interactions_collaborator ON public_interactions(collaborator);
CREATE INDEX idx_internal_deliberations_session ON internal_deliberations(session_id);
CREATE INDEX idx_coordination_events_trigger ON coordination_events(trigger_type);
CREATE INDEX idx_session_contexts_session ON session_contexts(session_id);
CREATE INDEX idx_session_contexts_collaborator ON session_contexts(collaborator);
CREATE INDEX idx_evaporating_clouds_deliberation ON evaporating_clouds(deliberation_id);

-- Views for common queries
CREATE VIEW active_personalities AS
SELECT * FROM personality_instances 
WHERE status = 'active';

CREATE VIEW recent_deliberations AS
SELECT d.*, pi.session_id, pi.human_input, pi.spokesperson_response
FROM internal_deliberations d
JOIN public_interactions pi ON d.public_interaction_id = pi.id
WHERE datetime(d.created_at) > datetime('now', '-7 days');

CREATE VIEW conflict_resolution_patterns AS
SELECT 
    do.surface_conflict as conflict_type,
    COUNT(*) as frequency,
    AVG(CASE WHEN do.synthesis_found THEN 1 ELSE 0 END) as success_rate,
    GROUP_CONCAT(DISTINCT do.new_capability_emerged) as capabilities_discovered
FROM discussion_openings do
WHERE datetime(do.created_at) > datetime('now', '-30 days')
GROUP BY do.surface_conflict;