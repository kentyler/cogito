-- Add many-to-many relationship between fragments and trees
-- This allows the same fragment to be part of multiple trees with different interpretations

-- Create junction table for fragment-tree assignments
CREATE TABLE thinking_tools.fragment_tree_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fragment_id UUID NOT NULL REFERENCES thinking_tools.tree_fragments(fragment_id) ON DELETE CASCADE,
    tree_id UUID NOT NULL REFERENCES thinking_tools.trees(tree_id) ON DELETE CASCADE,
    node_id VARCHAR(50), -- node ID within that specific tree
    assignment_confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (assignment_confidence >= 0 AND assignment_confidence <= 1),
    assignment_reason TEXT, -- why this fragment was assigned to this tree
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by VARCHAR(255) DEFAULT 'system',
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(fragment_id, tree_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_fragment_assignments_fragment ON thinking_tools.fragment_tree_assignments(fragment_id);
CREATE INDEX idx_fragment_assignments_tree ON thinking_tools.fragment_tree_assignments(tree_id);
CREATE INDEX idx_fragment_assignments_confidence ON thinking_tools.fragment_tree_assignments(assignment_confidence DESC);

-- Migrate existing tree_id assignments from tree_fragments to the new junction table
INSERT INTO thinking_tools.fragment_tree_assignments (fragment_id, tree_id, node_id, assignment_confidence, assignment_reason)
SELECT 
    fragment_id,
    tree_id,
    node_id,
    confidence,
    'Migrated from direct tree_id assignment'
FROM thinking_tools.tree_fragments
WHERE tree_id IS NOT NULL;

-- Now we can drop the direct tree_id reference from tree_fragments
ALTER TABLE thinking_tools.tree_fragments 
DROP COLUMN tree_id,
DROP COLUMN node_id;

-- Add a view to easily query fragments with their tree assignments
CREATE VIEW thinking_tools.fragments_with_trees AS
SELECT 
    f.*,
    COALESCE(
        json_agg(
            json_build_object(
                'tree_id', fta.tree_id,
                'node_id', fta.node_id,
                'assignment_confidence', fta.assignment_confidence,
                'tree_type', t.tree_type,
                'tree_title', t.title
            ) ORDER BY fta.assignment_confidence DESC
        ) FILTER (WHERE fta.tree_id IS NOT NULL),
        '[]'::json
    ) as tree_assignments
FROM thinking_tools.tree_fragments f
LEFT JOIN thinking_tools.fragment_tree_assignments fta ON f.fragment_id = fta.fragment_id
LEFT JOIN thinking_tools.trees t ON fta.tree_id = t.tree_id
GROUP BY f.fragment_id;

-- Function to assign a fragment to multiple trees
CREATE OR REPLACE FUNCTION thinking_tools.assign_fragment_to_trees(
    p_fragment_id UUID,
    p_tree_assignments JSONB -- Array of {tree_id, node_id, confidence, reason}
) RETURNS VOID AS $$
BEGIN
    -- Insert all assignments
    INSERT INTO thinking_tools.fragment_tree_assignments (fragment_id, tree_id, node_id, assignment_confidence, assignment_reason)
    SELECT 
        p_fragment_id,
        (assignment->>'tree_id')::UUID,
        assignment->>'node_id',
        COALESCE((assignment->>'confidence')::DECIMAL, 0.5),
        assignment->>'reason'
    FROM jsonb_array_elements(p_tree_assignments) AS assignment
    ON CONFLICT (fragment_id, tree_id) 
    DO UPDATE SET
        node_id = EXCLUDED.node_id,
        assignment_confidence = EXCLUDED.assignment_confidence,
        assignment_reason = EXCLUDED.assignment_reason,
        assigned_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to find fragments that could belong to a specific tree type
CREATE OR REPLACE FUNCTION thinking_tools.find_unassigned_fragments_for_tree_type(
    p_client_id INTEGER,
    p_tree_type VARCHAR(50)
) RETURNS TABLE (
    fragment_id UUID,
    toc_element_type VARCHAR(50),
    label TEXT,
    confidence DECIMAL(3,2),
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        f.fragment_id,
        f.toc_element_type,
        f.label,
        f.confidence,
        f.created_at
    FROM thinking_tools.tree_fragments f
    LEFT JOIN thinking_tools.fragment_tree_assignments fta ON f.fragment_id = fta.fragment_id
    LEFT JOIN thinking_tools.trees t ON fta.tree_id = t.tree_id AND t.tree_type = p_tree_type
    WHERE f.client_id = p_client_id
        AND t.tree_id IS NULL -- Not assigned to this tree type yet
        AND (
            -- Evaporating Cloud elements
            (p_tree_type = 'evaporating_cloud' AND f.toc_element_type IN ('want', 'need', 'conflict', 'assumption', 'objective'))
            -- Prerequisite Tree elements
            OR (p_tree_type = 'prerequisite_tree' AND f.toc_element_type IN ('obstacle', 'injection', 'objective'))
            -- Current Reality Tree elements
            OR (p_tree_type = 'current_reality_tree' AND f.toc_element_type IN ('undesirable_effect', 'root_cause', 'intermediate_effect'))
            -- Future Reality Tree elements
            OR (p_tree_type = 'future_reality_tree' AND f.toc_element_type IN ('desired_effect', 'solution', 'injection'))
            -- Transition Tree elements
            OR (p_tree_type = 'transition_tree' AND f.toc_element_type IN ('requirement', 'solution', 'obstacle'))
        )
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;