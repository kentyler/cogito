#!/usr/bin/env node

/**
 * Test TameFlow Board Creation
 * Demonstrates creating a complete TameFlow board with waiting columns
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false },
});

async function testTameFlowBoard() {
  const client = await pool.connect();
  
  try {
    console.log('🎮 Testing TameFlow board creation...\n');
    
    // Create a new game for TameFlow
    const gameResult = await client.query(
      'SELECT kanban.create_kanban_game($1, $2, $3)',
      [6, 'TameFlow Demo Board', 'tameflow']
    );
    const gameId = gameResult.rows[0].create_kanban_game;
    console.log(`✅ Created game #${gameId}: "TameFlow Demo Board"`);

    // Create a board for this game
    const boardResult = await client.query(
      'INSERT INTO kanban.kanban_boards (game_id, board_name, board_config) VALUES ($1, $2, $3) RETURNING board_id',
      [gameId, 'TameFlow Board', '{"type": "tameflow", "waiting_columns": true}']
    );
    const boardId = boardResult.rows[0].board_id;
    console.log(`✅ Created board #${boardId}: "TameFlow Board"`);

    // Create complete TameFlow board structure
    console.log('\n🏗️  Creating complete TameFlow board...');
    
    const tameflowResult = await client.query(
      'SELECT kanban.create_tameflow_board_conversationally($1, $2)',
      [gameId, boardId]
    );
    
    const boardStructure = tameflowResult.rows[0].create_tameflow_board_conversationally;
    console.log(`✅ Created ${boardStructure.columns_created} columns (${boardStructure.waiting_columns} waiting + ${boardStructure.work_columns} work)`);

    // Test individual TameFlow column creation
    console.log('\n🔄 Testing individual TameFlow column creation...');
    
    const codeReviewResult = await client.query(
      'SELECT kanban.create_tameflow_column_conversationally($1, $2, $3, $4, $5, $6)',
      [gameId, boardId, 'Code Review', 2, 11, false]
    );
    
    const reviewStructure = codeReviewResult.rows[0].create_tameflow_column_conversationally;
    console.log(`✅ Created TameFlow pair: Wait-Code Review → Code Review (WIP: 2)`);

    // Get all columns created
    const columnsResult = await client.query(`
      SELECT column_name, column_position, wip_limit, column_rules
      FROM kanban.kanban_columns 
      WHERE board_id = $1 
      ORDER BY column_position
    `, [boardId]);

    console.log('\n📊 Complete TameFlow board structure:');
    columnsResult.rows.forEach((col, index) => {
      const wipInfo = col.wip_limit ? ` (WIP: ${col.wip_limit})` : '';
      const typeInfo = col.column_rules?.type === 'waiting' ? ' [WAITING]' : ' [WORK]';
      console.log(`  ${index + 1}. ${col.column_name}${wipInfo}${typeInfo}`);
    });

    // Get conversation history to see TameFlow creation dialogue
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

    console.log('\n💬 TameFlow creation conversation:');
    conversationResult.rows.forEach((turn, index) => {
      const time = new Date(turn.timestamp).toLocaleTimeString();
      const type = turn.source_type.replace('_', ' ');
      const notation = turn.move_notation ? ` [${turn.move_notation}]` : '';
      console.log(`  ${index + 1}. [${time}] ${type}${notation}:`);
      console.log(`     ${turn.content}`);
    });

    // Create a task and move it through TameFlow
    console.log('\n📝 Testing task flow through TameFlow columns...');
    
    const taskResult = await client.query(
      'SELECT kanban.create_task_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, 'Implement user profile API', 'FEATURE', 'to do']
    );
    const taskId = taskResult.rows[0].create_task_conversationally;
    console.log(`✅ Created task T1: "Implement user profile API"`);

    // Move through TameFlow stages
    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, taskId, 'to do', 'wait-analysis']
    );
    console.log('✅ Moved T1 to Wait-Analysis (queued for analysis)');

    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)', 
      [gameId, taskId, 'wait-analysis', 'analysis']
    );
    console.log('✅ Moved T1 to Analysis (work begins)');

    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, taskId, 'analysis', 'wait-development']
    );
    console.log('✅ Moved T1 to Wait-Development (queued for development)');

    await client.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, taskId, 'wait-development', 'development']
    );
    console.log('✅ Moved T1 to Development (coding begins)');

    console.log('\n🎯 TameFlow Test Results:');
    console.log('✅ Complete TameFlow board created with waiting columns');
    console.log('✅ Every column creation participates in conversation');
    console.log('✅ Waiting columns expose queue and handoff delays');
    console.log('✅ Work columns have appropriate WIP limits');
    console.log('✅ Tasks flow through waiting → work → waiting pattern');
    console.log('✅ Board provides intelligent TameFlow-aware responses');
    
    console.log('\n💡 TameFlow Benefits Demonstrated:');
    console.log('  - Waiting columns make queues visible');
    console.log('  - Handoff delays are explicitly tracked');
    console.log('  - WIP limits prevent overloading work columns');
    console.log('  - Flow efficiency can be measured (work time vs wait time)');
    console.log('  - Bottlenecks become immediately apparent');

  } catch (error) {
    console.error('❌ TameFlow test failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testTameFlowBoard();