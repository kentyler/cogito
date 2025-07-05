#!/usr/bin/env node

/**
 * Add TameFlow Support
 * Updates conversational creation to include waiting columns before work columns
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false },
});

async function addTameFlowSupport() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding TameFlow support with waiting columns...\n');

    // Enhanced function to create TameFlow columns
    await client.query(`
      CREATE OR REPLACE FUNCTION kanban.create_tameflow_column_conversationally(
        p_game_id BIGINT,
        p_board_id BIGINT,
        p_column_name TEXT,
        p_wip_limit INTEGER DEFAULT NULL,
        p_position INTEGER DEFAULT NULL,
        p_skip_waiting BOOLEAN DEFAULT FALSE -- For special columns like "To Do" and "Done"
      ) RETURNS JSONB AS $$
      DECLARE
        move_turn_id UUID;
        response_turn_id UUID;
        new_move_id BIGINT;
        work_column_id BIGINT;
        waiting_column_id BIGINT;
        next_sequence INTEGER;
        base_position INTEGER;
        move_notation TEXT;
        move_description TEXT;
        board_response TEXT;
        result JSONB;
      BEGIN
        -- Get base position for columns
        SELECT COALESCE(p_position, (SELECT COALESCE(MAX(column_position), 0) + 1 FROM kanban.kanban_columns WHERE board_id = p_board_id))
        INTO base_position;
        
        -- Create waiting column first (unless skipped for special columns)
        IF NOT p_skip_waiting THEN
          INSERT INTO kanban.kanban_columns (
            board_id, column_name, column_position, wip_limit, column_rules
          ) VALUES (
            p_board_id, 
            'Wait-' || p_column_name,
            base_position,
            NULL, -- No WIP limit on waiting columns
            jsonb_build_object('type', 'waiting', 'feeds_into', p_column_name)
          ) RETURNING column_id INTO waiting_column_id;
          
          base_position := base_position + 1;
        END IF;
        
        -- Create the work column
        INSERT INTO kanban.kanban_columns (
          board_id, column_name, column_position, wip_limit, column_rules
        ) VALUES (
          p_board_id, 
          p_column_name,
          base_position,
          p_wip_limit,
          jsonb_build_object('type', 'work', 'waiting_column_id', waiting_column_id)
        ) RETURNING column_id INTO work_column_id;
        
        -- Create move notation
        IF p_skip_waiting THEN
          move_notation := 'ADD:COL[' || upper(p_column_name) || ']';
        ELSE
          move_notation := 'ADD:TAMEFLOW[WAIT-' || upper(p_column_name) || '→' || upper(p_column_name);
          IF p_wip_limit IS NOT NULL THEN
            move_notation := move_notation || ':' || p_wip_limit;
          END IF;
          move_notation := move_notation || ']';
        END IF;
        
        -- Create descriptions
        IF p_skip_waiting THEN
          move_description := 'Adding "' || p_column_name || '" column';
          board_response := p_column_name || ' column added';
        ELSE
          move_description := 'Adding TameFlow pair: "Wait-' || p_column_name || '" → "' || p_column_name || '"';
          IF p_wip_limit IS NOT NULL THEN
            move_description := move_description || ' with WIP limit ' || p_wip_limit;
          END IF;
          
          board_response := 'TameFlow columns added: Wait-' || p_column_name || ' exposes queue, ' || p_column_name;
          IF p_wip_limit IS NOT NULL THEN
            board_response := board_response || ' (WIP: ' || p_wip_limit || ')';
          END IF;
          board_response := board_response || ' handles work - excellent flow visibility!';
        END IF;
        
        -- Get next move sequence
        SELECT COALESCE(MAX(move_sequence), 0) + 1 INTO next_sequence
        FROM kanban.kanban_moves WHERE game_id = p_game_id;
        
        -- Create conversation turns
        INSERT INTO conversation.turns (content, source_type, metadata)
        VALUES (
          move_description,
          'kanban_move',
          jsonb_build_object(
            'game_id', p_game_id,
            'move_notation', move_notation,
            'sequence', next_sequence,
            'work_column_id', work_column_id,
            'waiting_column_id', waiting_column_id,
            'column_name', p_column_name,
            'tameflow', NOT p_skip_waiting
          )
        ) RETURNING turn_id INTO move_turn_id;
        
        INSERT INTO conversation.turns (content, source_type, metadata)
        VALUES (
          board_response,
          'kanban_board_response',
          jsonb_build_object(
            'game_id', p_game_id,
            'responding_to', move_turn_id,
            'work_column_created', work_column_id,
            'waiting_column_created', waiting_column_id
          )
        ) RETURNING turn_id INTO response_turn_id;
        
        -- Record the move
        INSERT INTO kanban.kanban_moves (
          game_id, move_turn_id, response_turn_id,
          move_notation, move_sequence, move_data
        ) VALUES (
          p_game_id, move_turn_id, response_turn_id,
          move_notation, next_sequence,
          jsonb_build_object(
            'work_column_id', work_column_id,
            'waiting_column_id', waiting_column_id,
            'column_name', p_column_name,
            'tameflow', NOT p_skip_waiting
          )
        ) RETURNING move_id INTO new_move_id;
        
        -- Build result
        result := jsonb_build_object(
          'work_column_id', work_column_id,
          'waiting_column_id', waiting_column_id,
          'move_id', new_move_id,
          'tameflow', NOT p_skip_waiting
        );
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created create_tameflow_column_conversationally function');

    // Function to create a complete TameFlow board
    await client.query(`
      CREATE OR REPLACE FUNCTION kanban.create_tameflow_board_conversationally(
        p_game_id BIGINT,
        p_board_id BIGINT
      ) RETURNS JSONB AS $$
      DECLARE
        result JSONB := '{}';
        todo_result JSONB;
        analysis_result JSONB;
        development_result JSONB;
        testing_result JSONB;
        deployment_result JSONB;
        done_result JSONB;
      BEGIN
        -- Create standard TameFlow board structure
        
        -- 1. To Do (no waiting column needed - it's the initial queue)
        SELECT kanban.create_tameflow_column_conversationally(
          p_game_id, p_board_id, 'To Do', NULL, 1, TRUE
        ) INTO todo_result;
        
        -- 2. Wait-Analysis → Analysis
        SELECT kanban.create_tameflow_column_conversationally(
          p_game_id, p_board_id, 'Analysis', NULL, 2, FALSE
        ) INTO analysis_result;
        
        -- 3. Wait-Development → Development  
        SELECT kanban.create_tameflow_column_conversationally(
          p_game_id, p_board_id, 'Development', 3, 4, FALSE
        ) INTO development_result;
        
        -- 4. Wait-Testing → Testing
        SELECT kanban.create_tameflow_column_conversationally(
          p_game_id, p_board_id, 'Testing', 2, 6, FALSE
        ) INTO testing_result;
        
        -- 5. Wait-Deployment → Deployment
        SELECT kanban.create_tameflow_column_conversationally(
          p_game_id, p_board_id, 'Deployment', 1, 8, FALSE
        ) INTO deployment_result;
        
        -- 6. Done (no waiting column needed - it's the final state)
        SELECT kanban.create_tameflow_column_conversationally(
          p_game_id, p_board_id, 'Done', NULL, 10, TRUE
        ) INTO done_result;
        
        -- Build comprehensive result
        result := jsonb_build_object(
          'board_type', 'tameflow',
          'columns_created', 8,
          'waiting_columns', 4,
          'work_columns', 4,
          'todo', todo_result,
          'analysis', analysis_result,
          'development', development_result,
          'testing', testing_result,
          'deployment', deployment_result,
          'done', done_result
        );
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created create_tameflow_board_conversationally function');

    // Update the simple column creation to default to TameFlow
    await client.query(`
      CREATE OR REPLACE FUNCTION kanban.create_column_conversationally(
        p_game_id BIGINT,
        p_board_id BIGINT,
        p_column_name TEXT,
        p_wip_limit INTEGER DEFAULT NULL,
        p_position INTEGER DEFAULT NULL
      ) RETURNS BIGINT AS $$
      DECLARE
        result JSONB;
        skip_waiting BOOLEAN := FALSE;
      BEGIN
        -- Skip waiting columns for special column types
        IF LOWER(p_column_name) IN ('to do', 'todo', 'backlog', 'done', 'completed') THEN
          skip_waiting := TRUE;
        END IF;
        
        -- Use TameFlow function
        SELECT kanban.create_tameflow_column_conversationally(
          p_game_id, p_board_id, p_column_name, p_wip_limit, p_position, skip_waiting
        ) INTO result;
        
        -- Return the work column ID for backward compatibility
        RETURN (result->>'work_column_id')::BIGINT;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Updated create_column_conversationally to use TameFlow by default');

    console.log('\n🎯 TameFlow support added!');
    console.log('📋 New functions available:');
    console.log('  - kanban.create_tameflow_column_conversationally(game_id, board_id, name, wip_limit, position, skip_waiting)');
    console.log('  - kanban.create_tameflow_board_conversationally(game_id, board_id)');
    console.log('  - kanban.create_column_conversationally() now creates TameFlow pairs by default');

    console.log('\n💡 TameFlow Structure:');
    console.log('  To Do → Wait-Analysis → Analysis → Wait-Development → Development → Wait-Testing → Testing → Wait-Deployment → Deployment → Done');
    console.log('  - Waiting columns expose queues and handoff delays');
    console.log('  - Work columns have WIP limits for flow control');
    console.log('  - Full conversation history for every column creation');

  } catch (error) {
    console.error('❌ Error adding TameFlow support:', error);
    throw error;
  } finally {
    client.release();
  }
}

addTameFlowSupport()
  .then(() => {
    console.log('\n🚀 TameFlow support ready! All column creation now follows TameFlow principles.');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 TameFlow setup failed:', error);
    process.exit(1);
  });