#!/usr/bin/env node

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

// Parse command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

async function listGames() {
  const result = await pool.query(`
    SELECT game_id, game_name, game_type, status, start_timestamp
    FROM kanban.kanban_games
    ORDER BY start_timestamp DESC
    LIMIT 10
  `);
  
  console.log('\n🎮 Recent Kanban Games:');
  result.rows.forEach(game => {
    console.log(`  #${game.game_id}: ${game.game_name} (${game.game_type}) - ${game.status}`);
  });
}

async function createGame(gameName, gameType = 'sprint') {
  const result = await pool.query(`
    SELECT kanban.create_game_conversationally($1, $2)
  `, [gameName, gameType]);
  
  const gameId = result.rows[0].create_game_conversationally;
  console.log(`✅ Created game "${gameName}" with ID: ${gameId}`);
  return gameId;
}

async function addColumn(gameId, boardId, columnName, wipLimit = null) {
  const result = await pool.query(`
    SELECT kanban.create_tameflow_column_conversationally($1::INTEGER, $2::INTEGER, $3::TEXT, $4::INTEGER)
  `, [parseInt(gameId), parseInt(boardId), columnName, wipLimit ? parseInt(wipLimit) : null]);
  
  const columnInfo = result.rows[0].create_tameflow_column_conversationally;
  console.log(`✅ Added column "${columnName}" to game #${gameId}`);
  console.log(`   Column ID: ${columnInfo.column_id}, Position: ${columnInfo.position}`);
}

async function createTask(gameId, boardId, taskTitle, taskType = 'TASK') {
  const result = await pool.query(`
    SELECT kanban.create_task_conversationally($1, $2, $3, $4)
  `, [gameId, boardId, taskTitle, taskType]);
  
  const taskId = result.rows[0].create_task_conversationally;
  console.log(`✅ Created task "${taskTitle}" with ID: ${taskId}`);
  return taskId;
}

async function moveTask(gameId, taskId, fromColumn, toColumn) {
  const result = await pool.query(`
    SELECT kanban.move_task_conversationally($1, $2, $3, $4)
  `, [gameId, taskId, fromColumn, toColumn]);
  
  const moveId = result.rows[0].move_task_conversationally;
  console.log(`✅ Moved task #${taskId} from ${fromColumn} to ${toColumn}`);
  return moveId;
}

async function showBoard(gameId) {
  // Get game info
  const gameResult = await pool.query(
    'SELECT * FROM kanban.kanban_games WHERE game_id = $1',
    [gameId]
  );
  
  if (gameResult.rows.length === 0) {
    console.log('❌ Game not found');
    return;
  }
  
  const game = gameResult.rows[0];
  console.log(`\n📋 ${game.game_name} (Game #${gameId})`);
  
  // Get board and columns
  const boardResult = await pool.query(`
    SELECT 
      kb.board_id,
      kb.board_name,
      kc.column_id,
      kc.column_name,
      kc.column_position,
      kc.wip_limit,
      COUNT(kt.task_id) as task_count
    FROM kanban.kanban_boards kb
    JOIN kanban.kanban_columns kc ON kb.board_id = kc.board_id
    LEFT JOIN kanban.kanban_tasks kt ON kt.current_column = kc.column_name
      AND kt.board_id = kb.board_id
    WHERE kb.game_id = $1
    GROUP BY kb.board_id, kb.board_name, kc.column_id, kc.column_name, kc.column_position, kc.wip_limit
    ORDER BY kc.column_position
  `, [gameId]);
  
  console.log('\nColumns:');
  boardResult.rows.forEach(col => {
    const wipInfo = col.wip_limit ? ` (WIP: ${col.wip_limit})` : '';
    console.log(`  ${col.column_position}. ${col.column_name}${wipInfo} - ${col.task_count} tasks`);
  });
  
  // Get tasks
  const taskResult = await pool.query(`
    SELECT task_id, task_title, task_type, current_column, created_at
    FROM kanban.kanban_tasks
    WHERE board_id IN (SELECT board_id FROM kanban.kanban_boards WHERE game_id = $1)
    ORDER BY current_column, created_at
  `, [gameId]);
  
  console.log('\nTasks:');
  let currentColumn = '';
  taskResult.rows.forEach(task => {
    if (task.current_column !== currentColumn) {
      currentColumn = task.current_column;
      console.log(`\n  [${currentColumn}]`);
    }
    console.log(`    #${task.task_id}: ${task.task_title} (${task.task_type})`);
  });
}

async function main() {
  try {
    switch (command) {
      case 'list':
        await listGames();
        break;
        
      case 'create-game':
        if (!args[0]) {
          console.log('Usage: create-game <game-name> [game-type]');
          break;
        }
        await createGame(args[0], args[1]);
        break;
        
      case 'add-column':
        if (args.length < 3) {
          console.log('Usage: add-column <game-id> <board-id> <column-name> [wip-limit]');
          break;
        }
        await addColumn(args[0], args[1], args[2], args[3]);
        break;
        
      case 'create-task':
        if (args.length < 3) {
          console.log('Usage: create-task <game-id> <board-id> <task-title> [task-type]');
          break;
        }
        await createTask(args[0], args[1], args[2], args[3]);
        break;
        
      case 'move-task':
        if (args.length < 4) {
          console.log('Usage: move-task <game-id> <task-id> <from-column> <to-column>');
          break;
        }
        await moveTask(args[0], args[1], args[2], args[3]);
        break;
        
      case 'show':
        if (!args[0]) {
          console.log('Usage: show <game-id>');
          break;
        }
        await showBoard(args[0]);
        break;
        
      default:
        console.log(`
🎮 Kanban Claude Commands

Usage: node claude-kanban-commands.js <command> [arguments]

Commands:
  list                                    List recent games
  create-game <name> [type]              Create a new game
  add-column <game-id> <board-id>        Add a column to a board
    <column-name> [wip-limit]
  create-task <game-id> <board-id>       Create a new task
    <task-title> [task-type]
  move-task <game-id> <task-id>          Move a task between columns
    <from-column> <to-column>
  show <game-id>                         Show board state

Examples:
  node claude-kanban-commands.js create-game "Sprint 1" sprint
  node claude-kanban-commands.js add-column 1 1 "Review" 3
  node claude-kanban-commands.js create-task 1 1 "Fix login bug" BUG
  node claude-kanban-commands.js move-task 1 1 "todo" "in-progress"
  node claude-kanban-commands.js show 1
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();