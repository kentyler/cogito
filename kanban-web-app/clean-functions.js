const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

async function cleanFunctions() {
  console.log('🧹 Cleaning up column functions...');
  
  try {
    // List all functions first
    console.log('Current functions:');
    const listResult = await pool.query(`
      SELECT routine_name, specific_name, routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'kanban' 
        AND routine_name LIKE '%column%'
      ORDER BY routine_name
    `);
    
    listResult.rows.forEach(row => {
      console.log(`  - ${row.routine_name} (${row.specific_name})`);
    });
    
    // Drop all variations
    console.log('\nDropping all column functions...');
    await pool.query(`
      DROP FUNCTION IF EXISTS kanban.create_tameflow_column_conversationally(INTEGER, INTEGER, TEXT, INTEGER, INTEGER, BOOLEAN);
      DROP FUNCTION IF EXISTS kanban.create_tameflow_column_conversationally(INTEGER, INTEGER, TEXT, INTEGER);
      DROP FUNCTION IF EXISTS kanban.create_tameflow_column_conversationally(INTEGER, INTEGER, TEXT);
      DROP FUNCTION IF EXISTS kanban.create_column_simple;
    `);
    
    // Create the new function
    console.log('Creating clean column function...');
    await pool.query(`
      CREATE FUNCTION kanban.create_tameflow_column_conversationally(
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
      BEGIN
          -- Get next position
          SELECT COALESCE(MAX(column_position), 0) + 1 INTO v_column_position
          FROM kanban.kanban_columns
          WHERE board_id = p_board_id;
          
          -- Insert the new column
          INSERT INTO kanban.kanban_columns (
              board_id,
              column_name,
              column_position,
              wip_limit
          ) VALUES (
              p_board_id,
              p_column_name,
              v_column_position,
              p_wip_limit
          ) RETURNING column_id INTO v_column_id;
          
          -- Return result
          RETURN jsonb_build_object(
              'column_id', v_column_id,
              'column_name', p_column_name,
              'position', v_column_position,
              'wip_limit', p_wip_limit,
              'success', true
          );
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Clean function created successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

cleanFunctions().catch(console.error);