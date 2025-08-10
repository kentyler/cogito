-- Create thinking_tools schema for TOC thinking tools data
-- Compatible with kentyler/ai-thinking-tools JSON format
-- Supports incremental updates during Claude sessions
-- Multi-tenant with client_id isolation

CREATE SCHEMA IF NOT EXISTS thinking_tools;

-- Base trees table - stores the foundational tree structures
CREATE TABLE thinking_tools.trees (
    tree_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    diagram_id VARCHAR(255), -- for compatibility with ai-thinking-tools format
    tree_type VARCHAR(50) NOT NULL CHECK (tree_type IN ('evaporating_cloud', 'prerequisite_tree', 'current_reality_tree', 'future_reality_tree', 'transition_tree')),
    title VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    base_tree_data JSONB NOT NULL, -- full tree structure in ai-thinking-tools format
    is_active BOOLEAN DEFAULT true,
    probability DECIMAL(3,2) DEFAULT 0.5, -- likelihood this tree represents current user direction
    confidence DECIMAL(3,2) DEFAULT 0.5,  -- confidence in tree accuracy
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Tree updates table - incremental changes during sessions
CREATE TABLE thinking_tools.tree_updates (
    update_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    tree_id UUID REFERENCES thinking_tools.trees(tree_id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN (
        'node_add', 'node_remove', 'node_modify',
        'link_add', 'link_remove', 'link_modify',
        'confidence_update', 'probability_update', 
        'tree_priority_shift', 'assumption_challenge',
        'resolution_found', 'tree_superseded'
    )),
    operation JSONB NOT NULL, -- the specific change made
    reason TEXT, -- why this update was made
    user_signal TEXT, -- what user action/statement triggered this update
    created_by VARCHAR(255) DEFAULT 'claude'
);

-- Tree relationships - how trees relate to each other
CREATE TABLE thinking_tools.tree_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    from_tree_id UUID REFERENCES thinking_tools.trees(tree_id) ON DELETE CASCADE,
    to_tree_id UUID REFERENCES thinking_tools.trees(tree_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'supersedes', 'conflicts_with', 'complements', 
        'prerequisites_for', 'evolved_from', 'merged_into'
    )),
    created_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Session contexts - links trees to specific conversation contexts
CREATE TABLE thinking_tools.session_contexts (
    context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    meeting_id UUID REFERENCES meetings.meetings(meeting_id) ON DELETE SET NULL,
    project_path TEXT, -- working directory context
    primary_tree_id UUID REFERENCES thinking_tools.trees(tree_id) ON DELETE SET NULL,
    context_data JSONB DEFAULT '{}'::jsonb, -- additional session metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tree fragments - isolated elements that can later be composed into trees
CREATE TABLE thinking_tools.tree_fragments (
    fragment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    fragment_type VARCHAR(50) NOT NULL CHECK (fragment_type IN ('node', 'link', 'concept')),
    toc_element_type VARCHAR(50) CHECK (toc_element_type IN (
        -- Evaporating Cloud elements
        'want', 'need', 'objective', 'conflict', 'assumption',
        -- Prerequisite Tree elements  
        'obstacle', 'injection',
        -- Current/Future Reality Tree elements
        'undesirable_effect', 'root_cause', 'intermediate_effect', 'desired_effect',
        -- General elements
        'constraint', 'solution', 'requirement'
    )),
    label TEXT NOT NULL,
    description TEXT,
    evidence TEXT, -- supporting evidence from conversation
    originating_turn_id UUID REFERENCES meetings.turns(turn_id) ON DELETE SET NULL, -- the turn that generated this fragment
    turn_references TEXT[], -- additional turn IDs that relate to this fragment
    confidence DECIMAL(3,2) DEFAULT 0.5,
    potential_trees TEXT[], -- which tree types this might belong to
    tree_id UUID REFERENCES thinking_tools.trees(tree_id) ON DELETE SET NULL, -- null if not yet assigned
    node_id VARCHAR(50), -- corresponding node ID in tree when promoted
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Fragment relationships - how fragments might connect before becoming formal tree links
CREATE TABLE thinking_tools.fragment_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    from_fragment_id UUID REFERENCES thinking_tools.tree_fragments(fragment_id) ON DELETE CASCADE,
    to_fragment_id UUID REFERENCES thinking_tools.tree_fragments(fragment_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) CHECK (relationship_type IN (
        'might_cause', 'conflicts_with', 'enables', 'requires', 
        'satisfies', 'supports', 'blocks', 'triggers'
    )),
    confidence DECIMAL(3,2) DEFAULT 0.3,
    evidence TEXT, -- why we think this relationship exists
    created_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_trees_client_session ON thinking_tools.trees(client_id, session_id);
CREATE INDEX idx_trees_client_type_active ON thinking_tools.trees(client_id, tree_type, is_active);
CREATE INDEX idx_tree_updates_client_tree ON thinking_tools.tree_updates(client_id, tree_id);
CREATE INDEX idx_tree_updates_timestamp ON thinking_tools.tree_updates(timestamp);
CREATE INDEX idx_session_contexts_client_session ON thinking_tools.session_contexts(client_id, session_id);
CREATE INDEX idx_fragments_client_session ON thinking_tools.tree_fragments(client_id, session_id);
CREATE INDEX idx_fragments_client_type ON thinking_tools.tree_fragments(client_id, toc_element_type);
CREATE INDEX idx_fragments_tree_id ON thinking_tools.tree_fragments(tree_id);
CREATE INDEX idx_fragment_relationships_client ON thinking_tools.fragment_relationships(client_id);
CREATE INDEX idx_fragment_relationships_from ON thinking_tools.fragment_relationships(from_fragment_id);

-- Function to get current tree state (base + all updates applied)
CREATE OR REPLACE FUNCTION thinking_tools.get_current_tree_state(p_tree_id UUID)
RETURNS JSONB AS $$
DECLARE
    base_data JSONB;
    update_record RECORD;
    current_state JSONB;
BEGIN
    -- Get base tree data
    SELECT base_tree_data INTO base_data 
    FROM thinking_tools.trees 
    WHERE tree_id = p_tree_id;
    
    IF base_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    current_state := base_data;
    
    -- Apply all updates in chronological order
    FOR update_record IN 
        SELECT operation, update_type 
        FROM thinking_tools.tree_updates 
        WHERE tree_id = p_tree_id 
        ORDER BY timestamp ASC
    LOOP
        -- This would need custom logic for each update_type
        -- For now, just merge the operation JSON
        current_state := current_state || update_record.operation;
    END LOOP;
    
    RETURN current_state;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new tree session context
CREATE OR REPLACE FUNCTION thinking_tools.create_session_context(
    p_client_id INTEGER,
    p_session_id VARCHAR(255),
    p_meeting_id UUID DEFAULT NULL,
    p_project_path TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    context_id UUID;
BEGIN
    INSERT INTO thinking_tools.session_contexts (client_id, session_id, meeting_id, project_path)
    VALUES (p_client_id, p_session_id, p_meeting_id, p_project_path)
    RETURNING context_id INTO context_id;
    
    RETURN context_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON SCHEMA thinking_tools IS 'Theory of Constraints thinking tools for Claude session analysis';
COMMENT ON TABLE thinking_tools.trees IS 'Base tree structures compatible with ai-thinking-tools format';
COMMENT ON TABLE thinking_tools.tree_updates IS 'Incremental updates made to trees during Claude sessions';
COMMENT ON TABLE thinking_tools.tree_relationships IS 'How trees relate to and evolve from each other';
COMMENT ON TABLE thinking_tools.session_contexts IS 'Links trees to specific conversation sessions';
COMMENT ON TABLE thinking_tools.tree_fragments IS 'Isolated TOC elements that can be composed into trees';
COMMENT ON TABLE thinking_tools.fragment_relationships IS 'Potential relationships between fragments';