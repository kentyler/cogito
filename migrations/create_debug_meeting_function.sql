-- Create a function to debug/inspect meeting data
CREATE OR REPLACE FUNCTION meetings.debug_meeting(target_meeting_id UUID)
RETURNS TABLE (
    info_type TEXT,
    info_value TEXT
) AS $$
DECLARE
    meeting_rec RECORD;
    turn_count INTEGER;
    transcript_length INTEGER;
    turn_rec RECORD;
    result_row RECORD;
BEGIN
    -- Get meeting details
    SELECT * INTO meeting_rec 
    FROM meetings.meetings 
    WHERE id = target_meeting_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'ERROR'::TEXT, ('Meeting not found: ' || target_meeting_id)::TEXT;
        RETURN;
    END IF;
    
    -- Return meeting basic info
    RETURN QUERY SELECT 'MEETING_ID'::TEXT, meeting_rec.id::TEXT;
    RETURN QUERY SELECT 'MEETING_URL'::TEXT, COALESCE(meeting_rec.meeting_url, 'NULL')::TEXT;
    RETURN QUERY SELECT 'STATUS'::TEXT, COALESCE(meeting_rec.status, 'NULL')::TEXT;
    RETURN QUERY SELECT 'CREATED_AT'::TEXT, meeting_rec.created_at::TEXT;
    RETURN QUERY SELECT 'BOT_ID'::TEXT, COALESCE(meeting_rec.recall_bot_id, 'NULL')::TEXT;
    
    -- Count turns
    SELECT COUNT(*) INTO turn_count 
    FROM meetings.turns 
    WHERE meeting_id = target_meeting_id;
    
    RETURN QUERY SELECT 'TURN_COUNT'::TEXT, turn_count::TEXT;
    
    -- Get latest turns
    FOR turn_rec IN 
        SELECT id, content, created_at 
        FROM meetings.turns 
        WHERE meeting_id = target_meeting_id 
        ORDER BY created_at DESC 
        LIMIT 3
    LOOP
        RETURN QUERY SELECT 
            ('TURN_' || turn_rec.id)::TEXT, 
            (LEFT(COALESCE(turn_rec.content::text, 'NULL'), 100) || ' [' || turn_rec.created_at::TEXT || ']')::TEXT;
    END LOOP;
    
    -- Check transcript
    IF meeting_rec.full_transcript IS NOT NULL THEN
        SELECT jsonb_array_length(meeting_rec.full_transcript) INTO transcript_length;
        RETURN QUERY SELECT 'TRANSCRIPT_LENGTH'::TEXT, transcript_length::TEXT;
        
        IF transcript_length > 0 THEN
            RETURN QUERY SELECT 'TRANSCRIPT_LAST'::TEXT, (meeting_rec.full_transcript -> -1)::TEXT;
            IF transcript_length > 1 THEN
                RETURN QUERY SELECT 'TRANSCRIPT_2ND_LAST'::TEXT, (meeting_rec.full_transcript -> -2)::TEXT;
            END IF;
        END IF;
    ELSE
        RETURN QUERY SELECT 'TRANSCRIPT_LENGTH'::TEXT, '0'::TEXT;
    END IF;
    
    -- Check summary
    IF meeting_rec.transcript_summary IS NOT NULL THEN
        RETURN QUERY SELECT 'SUMMARY'::TEXT, LEFT(meeting_rec.transcript_summary, 200)::TEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a simpler version that just prints everything
CREATE OR REPLACE FUNCTION meetings.inspect_meeting(target_meeting_id UUID)
RETURNS VOID AS $$
DECLARE
    meeting_rec RECORD;
    turn_count INTEGER;
    transcript_length INTEGER;
    turn_rec RECORD;
BEGIN
    -- Check if the meeting exists
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inspecting meeting: %', target_meeting_id;
    RAISE NOTICE '========================================';
    
    SELECT * INTO meeting_rec 
    FROM meetings.meetings 
    WHERE id = target_meeting_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Meeting found!';
        RAISE NOTICE '  URL: %', meeting_rec.meeting_url;
        RAISE NOTICE '  Status: %', meeting_rec.status;
        RAISE NOTICE '  Created: %', meeting_rec.created_at;
        RAISE NOTICE '  Bot ID: %', meeting_rec.recall_bot_id;
        
        -- Check for turns
        SELECT COUNT(*) INTO turn_count 
        FROM meetings.turns 
        WHERE meeting_id = target_meeting_id;
        
        RAISE NOTICE '';
        RAISE NOTICE '📝 Turns found: %', turn_count;
        
        -- Show first few turns
        FOR turn_rec IN 
            SELECT id, content, created_at 
            FROM meetings.turns 
            WHERE meeting_id = target_meeting_id 
            ORDER BY created_at DESC 
            LIMIT 3
        LOOP
            RAISE NOTICE '  Turn %: %', turn_rec.id, LEFT(turn_rec.content::text, 80);
            RAISE NOTICE '    Created: %', turn_rec.created_at;
        END LOOP;
        
        -- Check transcript
        IF meeting_rec.full_transcript IS NOT NULL THEN
            SELECT jsonb_array_length(meeting_rec.full_transcript) INTO transcript_length;
            RAISE NOTICE '';
            RAISE NOTICE '📄 Transcript entries: %', transcript_length;
            
            IF transcript_length > 0 THEN
                RAISE NOTICE '  Last entry: %', meeting_rec.full_transcript -> -1;
                IF transcript_length > 1 THEN
                    RAISE NOTICE '  2nd last: %', meeting_rec.full_transcript -> -2;
                END IF;
            END IF;
        ELSE
            RAISE NOTICE '📄 No transcript stored';
        END IF;
        
        -- Check summary
        IF meeting_rec.transcript_summary IS NOT NULL THEN
            RAISE NOTICE '';
            RAISE NOTICE '📋 Summary: %', LEFT(meeting_rec.transcript_summary, 200);
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Meeting not found with ID: %', target_meeting_id;
    END IF;
    
    RAISE NOTICE '========================================';
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM meetings.debug_meeting('51d7b1c0-5bac-47f4-967e-21dd271848d1');
-- SELECT meetings.inspect_meeting('51d7b1c0-5bac-47f4-967e-21dd271848d1');