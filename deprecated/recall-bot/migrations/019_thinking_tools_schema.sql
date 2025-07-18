-- Thinking Tools System Schema
-- Enables meeting bot to guide groups through structured thinking methodologies
-- Protects IP through encryption while allowing natural conversation integration

-- Create tools schema for thinking tools system
CREATE SCHEMA IF NOT EXISTS tools;

-- Main tool library table
CREATE TABLE tools.tool_library (
    tool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name VARCHAR(255) NOT NULL UNIQUE,
    author VARCHAR(255) NOT NULL,
    license_type VARCHAR(50) NOT NULL CHECK (license_type IN ('open', 'licensed', 'author-only')),
    requires_license BOOLEAN NOT NULL DEFAULT false,
    
    -- Encrypted instruction set (the actual facilitation methodology)
    instructions TEXT NOT NULL, -- Encrypted full instruction set
    encryption_key_id VARCHAR(100), -- Reference to encryption key for decryption
    
    -- For semantic matching and discovery
    instruction_embedding vector(1536), -- OpenAI embeddings for semantic search
    menu_description TEXT NOT NULL, -- Brief description for display in menus
    
    -- Pattern detection for automatic tool suggestion
    detection_patterns JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of conversation patterns
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    -- Usage and effectiveness tracking
    total_activations INTEGER DEFAULT 0,
    avg_effectiveness_rating DECIMAL(3,2), -- 1.00 to 5.00
    
    -- Tool categorization
    category VARCHAR(100), -- e.g., 'conflict_resolution', 'decision_making', 'brainstorming'
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration_minutes INTEGER,
    
    -- Prerequisites and context
    prerequisites TEXT, -- What conditions need to be met
    ideal_group_size_min INTEGER,
    ideal_group_size_max INTEGER
);

-- Client licensing table - who has access to what tools
CREATE TABLE tools.client_licenses (
    license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id BIGINT NOT NULL, -- References client_mgmt.clients
    tool_id UUID NOT NULL REFERENCES tools.tool_library(tool_id),
    
    -- License terms
    expires_date TIMESTAMP WITH TIME ZONE, -- NULL = perpetual
    usage_limit INTEGER, -- NULL = unlimited
    current_usage INTEGER DEFAULT 0,
    
    -- License metadata
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by_user_id BIGINT, -- Who granted this license
    license_notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(client_id, tool_id) -- One license per client per tool
);

-- Tool usage tracking - for analytics and billing
CREATE TABLE tools.tool_activations (
    activation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES tools.tool_library(tool_id),
    
    -- Meeting context
    meeting_block_id UUID REFERENCES conversation.blocks(block_id),
    client_id BIGINT NOT NULL,
    
    -- Activation details
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activation_method VARCHAR(50) NOT NULL CHECK (activation_method IN ('pattern_detected', 'explicit_request', 'menu_selection')),
    detected_patterns JSONB, -- Which patterns triggered this if pattern_detected
    
    -- Session tracking
    session_id UUID DEFAULT gen_random_uuid(), -- For multi-step tool sessions
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER,
    completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
    
    -- Participant feedback
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    participant_feedback TEXT,
    
    -- Usage metadata
    duration_minutes INTEGER,
    participant_count INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tool state tracking for multi-step processes
CREATE TABLE tools.tool_sessions (
    session_id UUID PRIMARY KEY,
    tool_id UUID NOT NULL REFERENCES tools.tool_library(tool_id),
    meeting_block_id UUID REFERENCES conversation.blocks(block_id),
    
    -- Current state
    current_step INTEGER NOT NULL DEFAULT 1,
    step_data JSONB DEFAULT '{}'::jsonb, -- Store step-specific data
    session_context JSONB DEFAULT '{}'::jsonb, -- Store session context
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    
    FOREIGN KEY (session_id) REFERENCES tools.tool_activations(session_id)
);

-- Pattern detection cache for performance
CREATE TABLE tools.pattern_cache (
    cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_block_id UUID NOT NULL REFERENCES conversation.blocks(block_id),
    
    -- Detected patterns
    patterns_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Cache metadata
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context_hash VARCHAR(64) NOT NULL, -- Hash of the conversation context used
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Indexes for performance
CREATE INDEX idx_tool_library_active ON tools.tool_library(is_active) WHERE is_active = true;
CREATE INDEX idx_tool_library_category ON tools.tool_library(category);
CREATE INDEX idx_tool_library_license_type ON tools.tool_library(license_type);
CREATE INDEX idx_tool_library_embedding ON tools.tool_library USING ivfflat (instruction_embedding vector_cosine_ops);

CREATE INDEX idx_client_licenses_client ON tools.client_licenses(client_id);
CREATE INDEX idx_client_licenses_active ON tools.client_licenses(client_id, is_active) WHERE is_active = true;

CREATE INDEX idx_tool_activations_meeting ON tools.tool_activations(meeting_block_id);
CREATE INDEX idx_tool_activations_client ON tools.tool_activations(client_id);
CREATE INDEX idx_tool_activations_date ON tools.tool_activations(activated_at);

CREATE INDEX idx_tool_sessions_meeting ON tools.tool_sessions(meeting_block_id);
CREATE INDEX idx_tool_sessions_active ON tools.tool_sessions(status) WHERE status = 'active';

CREATE INDEX idx_pattern_cache_meeting ON tools.pattern_cache(meeting_block_id);
CREATE INDEX idx_pattern_cache_expires ON tools.pattern_cache(expires_at);

-- Helper functions for tool system

-- Function to check if a client has access to a tool
CREATE OR REPLACE FUNCTION tools.client_has_tool_access(
    p_client_id BIGINT,
    p_tool_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if tool is open source (no license required)
    IF EXISTS (
        SELECT 1 FROM tools.tool_library 
        WHERE tool_id = p_tool_id 
        AND license_type = 'open' 
        AND is_active = true
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if client has valid license
    RETURN EXISTS (
        SELECT 1 FROM tools.client_licenses cl
        JOIN tools.tool_library tl ON cl.tool_id = tl.tool_id
        WHERE cl.client_id = p_client_id 
        AND cl.tool_id = p_tool_id
        AND cl.is_active = true
        AND tl.is_active = true
        AND (cl.expires_date IS NULL OR cl.expires_date > NOW())
        AND (cl.usage_limit IS NULL OR cl.current_usage < cl.usage_limit)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get available tools for a client
CREATE OR REPLACE FUNCTION tools.get_client_available_tools(
    p_client_id BIGINT
) RETURNS TABLE (
    tool_id UUID,
    tool_name VARCHAR(255),
    author VARCHAR(255),
    menu_description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(20),
    estimated_duration_minutes INTEGER,
    license_type VARCHAR(50),
    has_access BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tl.tool_id,
        tl.tool_name,
        tl.author,
        tl.menu_description,
        tl.category,
        tl.difficulty_level,
        tl.estimated_duration_minutes,
        tl.license_type,
        tools.client_has_tool_access(p_client_id, tl.tool_id) as has_access
    FROM tools.tool_library tl
    WHERE tl.is_active = true
    ORDER BY tl.tool_name;
END;
$$ LANGUAGE plpgsql;

-- Function to record tool activation
CREATE OR REPLACE FUNCTION tools.record_tool_activation(
    p_tool_id UUID,
    p_meeting_block_id UUID,
    p_client_id BIGINT,
    p_activation_method VARCHAR(50),
    p_detected_patterns JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_total_steps INTEGER;
BEGIN
    -- Get total steps for this tool (could be stored in tool metadata)
    SELECT COALESCE((instructions::jsonb->>'total_steps')::INTEGER, 1)
    INTO v_total_steps
    FROM tools.tool_library
    WHERE tool_id = p_tool_id;
    
    -- Generate session ID
    v_session_id := gen_random_uuid();
    
    -- Record activation
    INSERT INTO tools.tool_activations (
        tool_id,
        meeting_block_id,
        client_id,
        activation_method,
        detected_patterns,
        session_id,
        total_steps
    ) VALUES (
        p_tool_id,
        p_meeting_block_id,
        p_client_id,
        p_activation_method,
        p_detected_patterns,
        v_session_id,
        v_total_steps
    );
    
    -- Initialize session state
    INSERT INTO tools.tool_sessions (
        session_id,
        tool_id,
        meeting_block_id,
        current_step
    ) VALUES (
        v_session_id,
        p_tool_id,
        p_meeting_block_id,
        1
    );
    
    -- Update tool activation count
    UPDATE tools.tool_library
    SET total_activations = total_activations + 1
    WHERE tool_id = p_tool_id;
    
    -- Update client license usage if applicable
    UPDATE tools.client_licenses
    SET current_usage = current_usage + 1
    WHERE client_id = p_client_id 
    AND tool_id = p_tool_id
    AND is_active = true;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Comments explaining the system
COMMENT ON SCHEMA tools IS 'Thinking Tools System - Enables meeting bot to guide groups through structured thinking methodologies while protecting IP through encryption';

COMMENT ON TABLE tools.tool_library IS 'Main library of thinking tools with encrypted instructions and metadata for pattern detection';

COMMENT ON TABLE tools.client_licenses IS 'Client licensing for paid/restricted tools - controls who has access to what tools';

COMMENT ON TABLE tools.tool_activations IS 'Usage tracking for analytics, billing, and effectiveness measurement';

COMMENT ON TABLE tools.tool_sessions IS 'State tracking for multi-step tool processes during meetings';

COMMENT ON TABLE tools.pattern_cache IS 'Performance cache for pattern detection to avoid re-analyzing the same conversation context';