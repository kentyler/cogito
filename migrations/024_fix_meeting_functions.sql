-- Drop existing functions to fix return types
DROP FUNCTION IF EXISTS get_meeting_transcript(TEXT);
DROP FUNCTION IF EXISTS get_meeting_stats(TEXT);
DROP FUNCTION IF EXISTS find_meetings(TEXT);

-- Function to get meeting transcript with all details (fixed)
CREATE OR REPLACE FUNCTION get_meeting_transcript(meeting_url_param TEXT)
RETURNS TABLE (
    -- Meeting info
    meeting_id INTEGER,
    meeting_name TEXT,
    meeting_url TEXT,
    meeting_status TEXT,
    block_id UUID,
    block_name TEXT,
    -- Turn info
    turn_id UUID,
    participant_name TEXT,
    content TEXT,
    source_type TEXT,
    turn_timestamp TIMESTAMPTZ,
    sequence_order INTEGER,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bm.id as meeting_id,
        bm.meeting_name,
        bm.meeting_url,
        bm.status as meeting_status,
        bm.block_id,
        b.name as block_name,
        t.turn_id,
        COALESCE(p.name, 'Unknown') as participant_name,
        t.content,
        t.source_type,
        t.timestamp as turn_timestamp,
        bt.sequence_order,
        t.metadata
    FROM conversation.block_meetings bm
    LEFT JOIN conversation.blocks b ON bm.block_id = b.block_id
    LEFT JOIN conversation.block_turns bt ON bm.block_id = bt.block_id
    LEFT JOIN conversation.turns t ON bt.turn_id = t.turn_id
    LEFT JOIN conversation.participants p ON t.participant_id = p.id
    WHERE bm.meeting_url = meeting_url_param
    ORDER BY bt.sequence_order, t.timestamp;
END;
$$ LANGUAGE plpgsql;

-- Function to get meeting stats
CREATE OR REPLACE FUNCTION get_meeting_stats(meeting_url_param TEXT)
RETURNS TABLE (
    meeting_found BOOLEAN,
    total_turns INTEGER,
    unique_speakers INTEGER,
    speaker_list TEXT[],
    duration_minutes INTEGER,
    meeting_status TEXT
) AS $$
DECLARE
    meeting_record RECORD;
    turn_count INTEGER;
    speaker_count INTEGER;
    speakers TEXT[];
    duration_mins INTEGER;
BEGIN
    -- Check if meeting exists
    SELECT bm.*, b.name as block_name
    INTO meeting_record
    FROM conversation.block_meetings bm
    LEFT JOIN conversation.blocks b ON bm.block_id = b.block_id
    WHERE bm.meeting_url = meeting_url_param;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 0, ARRAY[]::TEXT[], 0, 'not_found'::TEXT;
        RETURN;
    END IF;
    
    -- Get turn count
    SELECT COUNT(*)
    INTO turn_count
    FROM conversation.block_turns bt
    JOIN conversation.turns t ON bt.turn_id = t.turn_id
    WHERE bt.block_id = meeting_record.block_id;
    
    -- Get unique speakers
    SELECT 
        COUNT(DISTINCT p.name),
        ARRAY_AGG(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL)
    INTO speaker_count, speakers
    FROM conversation.block_turns bt
    JOIN conversation.turns t ON bt.turn_id = t.turn_id
    LEFT JOIN conversation.participants p ON t.participant_id = p.id
    WHERE bt.block_id = meeting_record.block_id;
    
    -- Duration not available in current schema
    duration_mins := 0;
    
    RETURN QUERY SELECT 
        TRUE, 
        COALESCE(turn_count, 0), 
        COALESCE(speaker_count, 0),
        COALESCE(speakers, ARRAY[]::TEXT[]),
        COALESCE(duration_mins, 0),
        meeting_record.status;
END;
$$ LANGUAGE plpgsql;

-- Function to find meetings by partial URL or name
CREATE OR REPLACE FUNCTION find_meetings(search_term TEXT)
RETURNS TABLE (
    meeting_id INTEGER,
    meeting_name TEXT,
    meeting_url TEXT,
    status TEXT,
    block_id UUID,
    turn_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bm.id,
        bm.meeting_name,
        bm.meeting_url,
        bm.status,
        bm.block_id,
        COUNT(bt.turn_id) as turn_count
    FROM conversation.block_meetings bm
    LEFT JOIN conversation.block_turns bt ON bm.block_id = bt.block_id
    WHERE 
        bm.meeting_url ILIKE '%' || search_term || '%' 
        OR bm.meeting_name ILIKE '%' || search_term || '%'
    GROUP BY bm.id, bm.meeting_name, bm.meeting_url, bm.status, bm.block_id
    ORDER BY bm.id DESC;
END;
$$ LANGUAGE plpgsql;