-- Create the conversational column creation function
CREATE OR REPLACE FUNCTION kanban.create_tameflow_column_conversationally(
    p_game_id INTEGER,
    p_board_id INTEGER,
    p_column_name TEXT,
    p_wip_limit INTEGER DEFAULT NULL,
    p_position INTEGER DEFAULT NULL,
    p_skip_waiting BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
    v_column_id INTEGER;
    v_column_position INTEGER;
    v_is_waiting BOOLEAN;
    v_conversation_record JSONB;
BEGIN
    -- Determine position if not provided
    IF p_position IS NULL THEN
        SELECT COALESCE(MAX(column_position), 0) + 1 INTO v_column_position
        FROM kanban.kanban_columns
        WHERE board_id = p_board_id;
    ELSE
        v_column_position := p_position;
    END IF;
    
    -- Determine if this should be a waiting column (TameFlow pattern)
    -- Skip waiting columns for first and last positions unless explicitly requested
    v_is_waiting := NOT p_skip_waiting AND v_column_position > 1;
    
    -- Insert the new column
    INSERT INTO kanban.kanban_columns (
        board_id,
        column_name,
        column_position,
        wip_limit,
        rules
    ) VALUES (
        p_board_id,
        p_column_name,
        v_column_position,
        p_wip_limit,
        CASE 
            WHEN v_is_waiting THEN 
                jsonb_build_object(
                    'type', 'waiting',
                    'auto_transition', true,
                    'created_conversationally', true
                )
            ELSE 
                jsonb_build_object(
                    'created_conversationally', true
                )
        END
    ) RETURNING column_id INTO v_column_id;
    
    -- Build conversation record
    v_conversation_record := jsonb_build_object(
        'action', 'create_column',
        'column_id', v_column_id,
        'column_name', p_column_name,
        'position', v_column_position,
        'wip_limit', p_wip_limit,
        'is_waiting', v_is_waiting,
        'skip_waiting', p_skip_waiting,
        'timestamp', NOW(),
        'reasoning', CASE
            WHEN v_is_waiting THEN 
                'Created as TameFlow waiting column to manage flow between work stages'
            ELSE 
                'Created as active work column'
        END
    );
    
    -- Log the conversational action
    INSERT INTO kanban.kanban_conversation_log (
        game_id,
        turn_type,
        content,
        metadata
    ) VALUES (
        p_game_id,
        'SYSTEM_ACTION',
        'Created column "' || p_column_name || '" at position ' || v_column_position,
        v_conversation_record
    );
    
    RETURN v_conversation_record;
END;
$$ LANGUAGE plpgsql;

-- Also create a simpler version for basic column creation
CREATE OR REPLACE FUNCTION kanban.create_column_simple(
    p_game_id INTEGER,
    p_board_id INTEGER,
    p_column_name TEXT,
    p_wip_limit INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_column_id INTEGER;
    v_position INTEGER;
BEGIN
    -- Get next position
    SELECT COALESCE(MAX(column_position), 0) + 1 INTO v_position
    FROM kanban.kanban_columns
    WHERE board_id = p_board_id;
    
    -- Insert column
    INSERT INTO kanban.kanban_columns (
        board_id,
        column_name,
        column_position,
        wip_limit
    ) VALUES (
        p_board_id,
        p_column_name,
        v_position,
        p_wip_limit
    ) RETURNING column_id INTO v_column_id;
    
    RETURN v_column_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reorder columns
CREATE OR REPLACE FUNCTION kanban.reorder_columns(
    p_board_id INTEGER,
    p_column_id INTEGER,
    p_new_position INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_old_position INTEGER;
BEGIN
    -- Get current position
    SELECT column_position INTO v_old_position
    FROM kanban.kanban_columns
    WHERE column_id = p_column_id AND board_id = p_board_id;
    
    IF v_old_position IS NULL THEN
        RAISE EXCEPTION 'Column not found';
    END IF;
    
    -- Reorder columns
    IF v_old_position < p_new_position THEN
        -- Moving forward
        UPDATE kanban.kanban_columns
        SET column_position = column_position - 1
        WHERE board_id = p_board_id
          AND column_position > v_old_position
          AND column_position <= p_new_position;
    ELSE
        -- Moving backward
        UPDATE kanban.kanban_columns
        SET column_position = column_position + 1
        WHERE board_id = p_board_id
          AND column_position >= p_new_position
          AND column_position < v_old_position;
    END IF;
    
    -- Set new position
    UPDATE kanban.kanban_columns
    SET column_position = p_new_position
    WHERE column_id = p_column_id;
END;
$$ LANGUAGE plpgsql;