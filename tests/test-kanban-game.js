#!/usr/bin/env node

/**
 * Test Kanban Game Infrastructure
 * Creates a sample game and makes some moves to test the system
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false },
});

async function testKanbanGame() {
  const client = await pool.connect();
  
  try {
    console.log('🎮 Testing Kanban game infrastructure...\n');
    
    // Create a new game (using client_id 6 for Cogito)
    const gameResult = await client.query(
      'SELECT kanban.create_kanban_game($1, $2, $3)',
      [6, 'Test Sprint 1.0', 'sprint']
    );
    const gameId = gameResult.rows[0].create_kanban_game;
    console.log(`✅ Created game #${gameId}: "Test Sprint 1.0"`);

    // Make some opening moves (board creation)
    await client.query(
      'SELECT kanban.make_kanban_move($1, $2, $3, $4)',
      [
        gameId,
        'CREATE:BOARD',
        'Creating new Kanban board for Test Sprint 1.0',
        'Board created - ready for column definition and task creation'
      ]
    );
    console.log('✅ Move 1: Created board');

    await client.query(
      'SELECT kanban.make_kanban_move($1, $2, $3, $4)',
      [
        gameId,
        'ADD:COL[TODO]',
        'Adding "To Do" column',
        'To Do column added - this will be your backlog. Consider WIP limits for downstream columns'
      ]
    );
    console.log('✅ Move 2: Added "To Do" column');

    await client.query(
      'SELECT kanban.make_kanban_move($1, $2, $3, $4)',
      [
        gameId,
        'ADD:COL[PROG:3]',
        'Adding "In Progress" column with WIP limit 3',
        'In Progress column added with WIP limit 3 - good constraint for focus'
      ]
    );
    console.log('✅ Move 3: Added "In Progress" column');

    await client.query(
      'SELECT kanban.make_kanban_move($1, $2, $3, $4)',
      [
        gameId,
        'NEW:T1[AUTH]',
        'Creating task: Fix user authentication bug',
        'Task T1 created - authentication bugs are high priority, consider dependencies'
      ]
    );
    console.log('✅ Move 4: Created Task T1 (auth bug)');

    await client.query(
      'SELECT kanban.make_kanban_move($1, $2, $3, $4)',
      [
        gameId,
        'T1:TODO→PROG',
        'Moving T1 from To Do to In Progress',
        'T1 started - good to tackle auth issues early. Monitor for scope creep.'
      ]
    );
    console.log('✅ Move 5: Started work on T1');

    // Create a snapshot
    const snapshotResult = await client.query(
      'SELECT kanban.create_board_snapshot($1, NULL, $2, $3)',
      [gameId, 'initial_board_setup', 'manual']
    );
    const snapshotId = snapshotResult.rows[0].create_board_snapshot;
    console.log(`✅ Created snapshot #${snapshotId}: initial board setup`);

    // Test LLM snapshot request
    const llmSnapshotResult = await client.query(
      'SELECT kanban.request_llm_snapshot($1, NULL, $2, $3)',
      [gameId, 'Detected optimal initial flow setup', 0.87]
    );
    const llmSnapshotId = llmSnapshotResult.rows[0].request_llm_snapshot;
    console.log(`✅ LLM requested snapshot #${llmSnapshotId}: flow optimization detected`);

    // Get game history
    const movesResult = await client.query(
      'SELECT * FROM kanban.get_game_moves($1)',
      [gameId]
    );
    
    console.log('\n📋 Game move history:');
    movesResult.rows.forEach(move => {
      console.log(`  ${move.move_sequence}. ${move.move_notation}: ${move.move_content}`);
      console.log(`     Board: ${move.board_response}`);
    });

    // Check conversation integration
    const turnsResult = await client.query(`
      SELECT 
        content,
        source_type,
        metadata->>'move_notation' as move_notation,
        timestamp
      FROM meetings.turns 
      WHERE metadata->>'game_id' = $1
      ORDER BY timestamp
    `, [gameId.toString()]);

    console.log('\n💬 Conversation turns:');
    turnsResult.rows.forEach(turn => {
      console.log(`  [${turn.source_type}] ${turn.content}`);
      if (turn.move_notation) console.log(`    Move: ${turn.move_notation}`);
    });

    console.log('\n🎯 Test completed successfully!');
    console.log(`📊 Game stats:`);
    console.log(`  - Game ID: ${gameId}`);
    console.log(`  - Total moves: ${movesResult.rows.length}`);
    console.log(`  - Snapshots: 2 (1 manual, 1 LLM-requested)`);
    console.log(`  - Conversation turns: ${turnsResult.rows.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testKanbanGame();