#!/usr/bin/env node

/**
 * Enhanced Conversational Creation
 * Adds functions to create columns and tasks as conversational participants
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false },
});

async function enhanceConversationalCreation() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding conversational creation functions...\n');

    // Function to create a column as a conversational participant
    await client.query(`
      CREATE OR REPLACE FUNCTION kanban.create_column_conversationally(
        p_game_id BIGINT,
        p_board_id BIGINT,
        p_column_name TEXT,
        p_wip_limit INTEGER DEFAULT NULL,
        p_position INTEGER DEFAULT NULL
      ) RETURNS BIGINT AS $$
      DECLARE
        move_turn_id UUID;
        response_turn_id UUID;
        move_id BIGINT;
        new_column_id BIGINT;
        next_sequence INTEGER;
        move_notation TEXT;
        move_description TEXT;
        board_response TEXT;
      BEGIN
        -- Create the actual column
        INSERT INTO kanban.kanban_columns (
          board_id, column_name, column_position, wip_limit
        ) VALUES (
          p_board_id, p_column_name, 
          COALESCE(p_position, (SELECT COALESCE(MAX(column_position), 0) + 1 FROM kanban.kanban_columns WHERE board_id = p_board_id)),
          p_wip_limit
        ) RETURNING column_id INTO new_column_id;
        
        -- Create move notation
        move_notation := 'ADD:COL[' || upper(p_column_name);
        IF p_wip_limit IS NOT NULL THEN
          move_notation := move_notation || ':' || p_wip_limit;
        END IF;
        move_notation := move_notation || ']';
        
        -- Create descriptions
        move_description := 'Adding "' || p_column_name || '" column';
        IF p_wip_limit IS NOT NULL THEN
          move_description := move_description || ' with WIP limit ' || p_wip_limit;
        END IF;
        
        board_response := p_column_name || ' column added';
        IF p_wip_limit IS NOT NULL THEN
          board_response := board_response || ' with WIP limit ' || p_wip_limit || ' - good constraint for focus';
        ELSE
          board_response := board_response || ' - consider adding WIP limits for flow control';
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
            'column_id', new_column_id,
            'column_name', p_column_name
          )
        ) RETURNING turn_id INTO move_turn_id;
        
        INSERT INTO conversation.turns (content, source_type, metadata)
        VALUES (
          board_response,
          'kanban_board_response',
          jsonb_build_object(
            'game_id', p_game_id,
            'responding_to', move_turn_id,
            'column_created', new_column_id
          )
        ) RETURNING turn_id INTO response_turn_id;
        
        -- Record the move
        INSERT INTO kanban.kanban_moves (
          game_id, move_turn_id, response_turn_id,
          move_notation, move_sequence, move_data
        ) VALUES (
          p_game_id, move_turn_id, response_turn_id,
          move_notation, next_sequence,
          jsonb_build_object('column_id', new_column_id, 'column_name', p_column_name)
        ) RETURNING move_id INTO move_id;
        
        RETURN new_column_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created create_column_conversationally function');

    // Function to create a task as a conversational participant
    await client.query(`
      CREATE OR REPLACE FUNCTION kanban.create_task_conversationally(
        p_game_id BIGINT,
        p_board_id BIGINT,
        p_task_title TEXT,
        p_task_type TEXT DEFAULT 'TASK',
        p_initial_column TEXT DEFAULT 'todo'
      ) RETURNS BIGINT AS $$
      DECLARE
        move_turn_id UUID;
        response_turn_id UUID;
        move_id BIGINT;
        new_task_id BIGINT;
        task_number INTEGER;
        next_sequence INTEGER;
        move_notation TEXT;
        move_description TEXT;
        board_response TEXT;
      BEGIN
        -- Get next task number for this board
        SELECT COALESCE(MAX(task_number), 0) + 1 INTO task_number
        FROM kanban.kanban_tasks WHERE board_id = p_board_id;
        
        -- Create the actual task
        INSERT INTO kanban.kanban_tasks (
          board_id, task_number, task_title, current_column, task_metadata
        ) VALUES (
          p_board_id, task_number, p_task_title, p_initial_column,
          jsonb_build_object('type', p_task_type, 'created_via', 'conversation')
        ) RETURNING task_id INTO new_task_id;
        
        -- Create move notation
        move_notation := 'NEW:T' || task_number || '[' || p_task_type || ']';
        
        -- Create descriptions
        move_description := 'Creating task: ' || p_task_title;
        
        -- Intelligent board response based on task type
        CASE p_task_type
          WHEN 'AUTH' THEN
            board_response := 'Task T' || task_number || ' created - authentication tasks are high priority, consider dependencies';
          WHEN 'BUG' THEN
            board_response := 'Task T' || task_number || ' created - bug fixes should be prioritized for stability';
          WHEN 'FEATURE' THEN
            board_response := 'Task T' || task_number || ' created - new feature, ensure proper testing coverage';
          ELSE
            board_response := 'Task T' || task_number || ' created - review scope and dependencies';
        END CASE;
        
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
            'task_id', new_task_id,
            'task_number', task_number,
            'task_type', p_task_type
          )
        ) RETURNING turn_id INTO move_turn_id;
        
        INSERT INTO conversation.turns (content, source_type, metadata)
        VALUES (
          board_response,
          'kanban_board_response',
          jsonb_build_object(
            'game_id', p_game_id,
            'responding_to', move_turn_id,
            'task_created', new_task_id
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
            'task_id', new_task_id, 
            'task_number', task_number,
            'task_title', p_task_title,
            'task_type', p_task_type
          )
        ) RETURNING move_id INTO move_id;
        
        RETURN new_task_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created create_task_conversationally function');

    // Function to move task conversationally (enhanced version)
    await client.query(`
      CREATE OR REPLACE FUNCTION kanban.move_task_conversationally(
        p_game_id BIGINT,
        p_task_id BIGINT,
        p_from_column TEXT,
        p_to_column TEXT
      ) RETURNS BIGINT AS $$
      DECLARE
        move_turn_id UUID;
        response_turn_id UUID;
        move_id BIGINT;
        task_info RECORD;
        next_sequence INTEGER;
        move_notation TEXT;
        move_description TEXT;
        board_response TEXT;
      BEGIN
        -- Get task info
        SELECT task_number, task_title, task_metadata->>'type' as task_type
        INTO task_info
        FROM kanban.kanban_tasks 
        WHERE task_id = p_task_id;
        
        -- Update task location
        UPDATE kanban.kanban_tasks 
        SET current_column = p_to_column, updated_at = NOW()
        WHERE task_id = p_task_id;
        
        -- Create move notation
        move_notation := 'T' || task_info.task_number || ':' || upper(p_from_column) || '→' || upper(p_to_column);
        
        -- Create descriptions
        move_description := 'Moving T' || task_info.task_number || ' from ' || initcap(p_from_column) || ' to ' || initcap(p_to_column);
        
        -- Intelligent board response based on transition
        IF p_to_column = 'in-progress' THEN
          board_response := 'T' || task_info.task_number || ' started - good to tackle ' || LOWER(task_info.task_type) || ' tasks early. Monitor for scope creep.';
        ELSIF p_to_column = 'testing' THEN
          board_response := 'T' || task_info.task_number || ' moved to testing - ensure proper test coverage and acceptance criteria.';
        ELSIF p_to_column = 'done' THEN
          board_response := 'T' || task_info.task_number || ' completed - great progress! Review for any follow-up tasks.';
        ELSE
          board_response := 'T' || task_info.task_number || ' moved to ' || initcap(p_to_column) || ' - monitoring progress and dependencies';
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
            'task_id', p_task_id,
            'from_column', p_from_column,
            'to_column', p_to_column
          )
        ) RETURNING turn_id INTO move_turn_id;
        
        INSERT INTO conversation.turns (content, source_type, metadata)
        VALUES (
          board_response,
          'kanban_board_response',
          jsonb_build_object(
            'game_id', p_game_id,
            'responding_to', move_turn_id,
            'task_moved', p_task_id
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
            'task_id', p_task_id,
            'from_column', p_from_column,
            'to_column', p_to_column,
            'task_number', task_info.task_number
          )
        ) RETURNING move_id INTO move_id;
        
        RETURN move_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created move_task_conversationally function');

    console.log('\n🎯 Enhanced functions ready!');
    console.log('📋 New conversational functions:');
    console.log('  - kanban.create_column_conversationally(game_id, board_id, name, wip_limit, position)');
    console.log('  - kanban.create_task_conversationally(game_id, board_id, title, type, initial_column)');
    console.log('  - kanban.move_task_conversationally(game_id, task_id, from_column, to_column)');

  } catch (error) {
    console.error('❌ Error enhancing conversational creation:', error);
    throw error;
  } finally {
    client.release();
  }
}

enhanceConversationalCreation()
  .then(() => {
    console.log('\n🚀 All columns and tasks will now participate in conversations!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Enhancement failed:', error);
    process.exit(1);
  });