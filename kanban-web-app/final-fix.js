#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false },
});

async function finalFix() {
  const client = await pool.connect();
  
  try {
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
        new_move_id BIGINT;
        new_task_id BIGINT;
        next_task_number INTEGER;
        next_sequence INTEGER;
        move_notation TEXT;
        move_description TEXT;
        board_response TEXT;
      BEGIN
        -- Get next task number for this board
        SELECT COALESCE(MAX(kt.task_number), 0) + 1 INTO next_task_number
        FROM kanban.kanban_tasks kt WHERE kt.board_id = p_board_id;
        
        -- Create the actual task
        INSERT INTO kanban.kanban_tasks (
          board_id, task_number, task_title, current_column, task_metadata
        ) VALUES (
          p_board_id, next_task_number, p_task_title, p_initial_column,
          jsonb_build_object('type', p_task_type, 'created_via', 'conversation')
        ) RETURNING task_id INTO new_task_id;
        
        -- Create move notation
        move_notation := 'NEW:T' || next_task_number || '[' || p_task_type || ']';
        
        -- Create descriptions
        move_description := 'Creating task: ' || p_task_title;
        
        -- Intelligent board response based on task type
        CASE p_task_type
          WHEN 'AUTH' THEN
            board_response := 'Task T' || next_task_number || ' created - authentication tasks are high priority, consider dependencies';
          WHEN 'BUG' THEN
            board_response := 'Task T' || next_task_number || ' created - bug fixes should be prioritized for stability';
          WHEN 'FEATURE' THEN
            board_response := 'Task T' || next_task_number || ' created - new feature, ensure proper testing coverage';
          ELSE
            board_response := 'Task T' || next_task_number || ' created - review scope and dependencies';
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
            'task_number', next_task_number,
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
            'task_number', next_task_number,
            'task_title', p_task_title,
            'task_type', p_task_type
          )
        ) RETURNING move_id INTO new_move_id;
        
        RETURN new_task_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fixed task creation function');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

finalFix();