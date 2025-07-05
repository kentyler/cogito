-- Migration to loosen constraints on pattern-related tables
-- This makes it easier to insert and work with patterns without strict requirements

-- 1. Alter pattern_types table to make instruction columns nullable
ALTER TABLE pattern_types 
    ALTER COLUMN detection_instructions DROP NOT NULL,
    ALTER COLUMN analysis_instructions DROP NOT NULL,
    ALTER COLUMN application_instructions DROP NOT NULL;

-- 2. Add default values for common columns
ALTER TABLE pattern_types 
    ALTER COLUMN usefulness_score SET DEFAULT 0.5,
    ALTER COLUMN usage_count SET DEFAULT 0,
    ALTER COLUMN is_active SET DEFAULT true;

-- 3. Add a unique constraint on pattern_types.name for easier upserts
ALTER TABLE pattern_types 
    ADD CONSTRAINT pattern_types_name_unique UNIQUE (name);

-- 4. Add a unique constraint on detected_patterns for participant+pattern combination
ALTER TABLE detected_patterns 
    ADD CONSTRAINT detected_patterns_participant_pattern_unique 
    UNIQUE (participant_id, pattern_type_id);

-- 5. Make some detected_patterns columns nullable for flexibility
ALTER TABLE detected_patterns
    ALTER COLUMN conversation_id DROP NOT NULL,
    ALTER COLUMN interaction_id DROP NOT NULL,
    ALTER COLUMN reasoning DROP NOT NULL,
    ALTER COLUMN context_scope DROP NOT NULL;

-- 6. Add default for confidence_score
ALTER TABLE detected_patterns
    ALTER COLUMN confidence_score SET DEFAULT 0.5;

-- 7. Add created_at/updated_at to detected_patterns if not exists
ALTER TABLE detected_patterns
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 8. Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_detected_patterns_updated_at ON detected_patterns;
CREATE TRIGGER update_detected_patterns_updated_at
    BEFORE UPDATE ON detected_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pattern_types_updated_at ON pattern_types;
CREATE TRIGGER update_pattern_types_updated_at
    BEFORE UPDATE ON pattern_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_detected_patterns_participant 
    ON detected_patterns(participant_id);

CREATE INDEX IF NOT EXISTS idx_detected_patterns_pattern_type 
    ON detected_patterns(pattern_type_id);

CREATE INDEX IF NOT EXISTS idx_pattern_types_name 
    ON pattern_types(name);

-- 10. Add a comment to document the loosened constraints
COMMENT ON TABLE pattern_types IS 'Pattern definitions with relaxed constraints for easier data entry';
COMMENT ON TABLE detected_patterns IS 'Detected patterns with relaxed constraints - only participant_id and pattern_type_id are required';