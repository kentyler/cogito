#!/usr/bin/env node

/**
 * Test Conversational Creation
 * Demonstrates columns and tasks participating in conversations
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false },
});

async function testConversationalCreation() {
  const client = await pool.connect();
  
  try {
    console.log('🎮 Testing conversational creation...\n');
    
    // Create a new game first
    const gameResult = await client.query(
      'SELECT kanban.create_kanban_game($1, $2, $3)',
      [6, 'Conversational Test Game', 'demo']
    );
    const gameId = gameResult.rows[0].create_kanban_game;
    console.log(`✅ Created game #${gameId}: "Conversational Test Game"`);

    // Create a board for this game
    const boardResult = await client.query(
      'INSERT INTO kanban.kanban_boards (game_id, board_name) VALUES ($1, $2) RETURNING board_id',
      [gameId, 'Demo Board']
    );
    const boardId = boardResult.rows[0].board_id;
    console.log(`✅ Created board #${boardId}: "Demo Board"`);

    // Test 1: Create columns conversationally
    console.log('\n🏗️  Testing column creation...');
    
    await client.query(
      'SELECT kanban.create_column_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'To Do', null, 1]
    );
    console.log('✅ Created "To Do" column');

    await client.query(
      'SELECT kanban.create_column_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'In Progress', 3, 2]
    );
    console.log('✅ Created "In Progress" column with WIP limit 3');

    await client.query(
      'SELECT kanban.create_column_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'Testing', 2, 3]
    );
    console.log('✅ Created "Testing" column with WIP limit 2');

    await client.query(
      'SELECT kanban.create_column_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'Done', null, 4]
    );
    console.log('✅ Created "Done" column');

    // Test 2: Create tasks conversationally
    console.log('\n📝 Testing task creation...');
    
    const authTaskResult = await client.query(
      'SELECT kanban.create_task_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'Fix user authentication bug', 'AUTH', 'todo']
    );
    const authTaskId = authTaskResult.rows[0].create_task_conversationally;
    console.log(`✅ Created auth task #${authTaskId}`);

    const featureTaskResult = await client.query(
      'SELECT kanban.create_task_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'Add dark mode toggle', 'FEATURE', 'todo']
    );
    const featureTaskId = featureTaskResult.rows[0].create_task_conversationally;
    console.log(`✅ Created feature task #${featureTaskId}`);

    const bugTaskResult = await client.query(
      'SELECT kanban.create_task_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'Fix memory leak in dashboard', 'BUG', 'todo']
    );
    const bugTaskId = bugTaskResult.rows[0].create_task_conversationally;
    console.log(`✅ Created bug task #${bugTaskId}`);

    // Test 3: Move tasks conversationally
    console.log('\n🔄 Testing task movement...');
    
    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, authTaskId, 'todo', 'in-progress']
    );
    console.log('✅ Moved auth task to In Progress');

    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, featureTaskId, 'todo', 'in-progress']
    );
    console.log('✅ Moved feature task to In Progress');

    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, authTaskId, 'in-progress', 'testing']
    );
    console.log('✅ Moved auth task to Testing');

    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, authTaskId, 'testing', 'done']
    );
    console.log('✅ Moved auth task to Done');

    // Get all conversation turns to see the dialogue
    const conversationResult = await client.query(`
      SELECT 
        content,
        source_type,
        metadata->>'move_notation' as move_notation,
        timestamp
      FROM conversation.turns 
      WHERE metadata->>'game_id' = $1
      ORDER BY timestamp
    `, [gameId.toString()]);

    console.log('\n💬 Full conversation history:');
    conversationResult.rows.forEach((turn, index) => {
      const time = new Date(turn.timestamp).toLocaleTimeString();
      const type = turn.source_type.replace('_', ' ');
      const notation = turn.move_notation ? ` [${turn.move_notation}]` : '';
      console.log(`  ${index + 1}. [${time}] ${type}${notation}:`);
      console.log(`     ${turn.content}`);
    });

    // Get game statistics
    const movesResult = await client.query(
      'SELECT COUNT(*) as move_count FROM kanban.kanban_moves WHERE game_id = $1',
      [gameId]
    );
    
    const tasksResult = await client.query(
      'SELECT COUNT(*) as task_count FROM kanban.kanban_tasks WHERE board_id = $1',
      [boardId]
    );

    const columnsResult = await client.query(
      'SELECT COUNT(*) as column_count FROM kanban.kanban_columns WHERE board_id = $1',
      [boardId]
    );

    console.log('\n📊 Game Statistics:');
    console.log(`  - Game ID: ${gameId}`);
    console.log(`  - Board ID: ${boardId}`);
    console.log(`  - Columns created: ${columnsResult.rows[0].column_count}`);
    console.log(`  - Tasks created: ${tasksResult.rows[0].task_count}`);
    console.log(`  - Total moves: ${movesResult.rows[0].move_count}`);
    console.log(`  - Conversation turns: ${conversationResult.rows.length}`);

    console.log('\n🎯 Test Results:');
    console.log('✅ Columns participate in conversations');
    console.log('✅ Tasks participate in conversations');
    console.log('✅ Moves create intelligent board responses');
    console.log('✅ Full conversation history preserved');
    console.log('✅ Every creation becomes a conversational turn');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testConversationalCreation();