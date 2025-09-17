-- Add directed_to field to turns table for attention/mention system
-- Simple JSONB array to store user IDs that a turn is directed to

BEGIN;

-- Add directed_to column as JSONB array to store user IDs
ALTER TABLE meetings.turns
ADD COLUMN directed_to JSONB DEFAULT '[]'::jsonb;

-- GIN index for efficient "contains" queries to find turns directed to a user
CREATE INDEX idx_turns_directed_to ON meetings.turns USING GIN (directed_to);

-- Add comment for documentation
COMMENT ON COLUMN meetings.turns.directed_to IS 'Array of user IDs this turn is directed to for attention. Empty array means not directed. Example: [1, 5, 12]';

-- Add helper function to get turns directed to a specific user
CREATE OR REPLACE FUNCTION meetings.get_turns_directed_to_user(
    p_user_id BIGINT,
    p_meeting_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 100
) 
RETURNS TABLE (
    id UUID,
    meeting_id UUID,
    user_id BIGINT,
    content TEXT,
    directed_to JSONB,
    turn_timestamp TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.meeting_id,
        t.user_id,
        t.content,
        t.directed_to,
        t.timestamp as turn_timestamp,
        t.metadata
    FROM meetings.turns t
    WHERE 
        t.directed_to @> to_jsonb(p_user_id)
        AND (p_meeting_id IS NULL OR t.meeting_id = p_meeting_id)
    ORDER BY t.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION meetings.get_turns_directed_to_user IS 'Get turns directed to a specific user, optionally filtered by meeting';

-- Add helper function to add/remove user from directed_to
CREATE OR REPLACE FUNCTION meetings.update_turn_direction(
    p_turn_id UUID,
    p_user_id BIGINT,
    p_action VARCHAR(10) -- 'add' or 'remove'
)
RETURNS JSONB AS $$
DECLARE
    v_directed_to JSONB;
BEGIN
    IF p_action = 'add' THEN
        UPDATE meetings.turns
        SET directed_to = CASE 
            WHEN directed_to @> to_jsonb(p_user_id) THEN directed_to
            ELSE directed_to || to_jsonb(p_user_id)
        END
        WHERE id = p_turn_id
        RETURNING directed_to INTO v_directed_to;
    ELSIF p_action = 'remove' THEN
        UPDATE meetings.turns
        SET directed_to = (
            SELECT jsonb_agg(value)
            FROM jsonb_array_elements(directed_to) AS value
            WHERE value != to_jsonb(p_user_id)
        )
        WHERE id = p_turn_id
        RETURNING directed_to INTO v_directed_to;
    ELSE
        RAISE EXCEPTION 'Invalid action. Use "add" or "remove"';
    END IF;
    
    RETURN COALESCE(v_directed_to, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION meetings.update_turn_direction IS 'Add or remove a user from a turn''s directed_to list';

COMMIT;

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Added directed_to field for simple attention/mention system';
END $$;