const express = require('express');
const cors = require('cors');
const pg = require('pg');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new pg.Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', (ws) => {
  console.log('🔌 Client connected to WebSocket');
  
  ws.on('message', (message) => {
    console.log('📨 Received:', message.toString());
  });
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected from WebSocket');
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// API Routes

// Get all games
app.get('/api/games', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        game_id,
        game_name,
        game_type,
        status,
        start_timestamp,
        end_timestamp,
        game_metadata
      FROM kanban.kanban_games 
      ORDER BY start_timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get specific game with moves
app.get('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Get game info
    const gameResult = await pool.query(
      'SELECT * FROM kanban.kanban_games WHERE game_id = $1',
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Get moves
    const movesResult = await pool.query(
      'SELECT * FROM kanban.get_game_moves($1)',
      [gameId]
    );
    
    // Get actual board structure
    const boardsResult = await pool.query(`
      SELECT 
        kb.board_id,
        kb.board_name,
        kb.board_config,
        json_agg(
          json_build_object(
            'column_id', kc.column_id,
            'column_name', kc.column_name,
            'column_position', kc.column_position,
            'wip_limit', kc.wip_limit,
            'column_rules', kc.column_rules
          ) ORDER BY kc.column_position
        ) as columns
      FROM kanban.kanban_boards kb
      LEFT JOIN kanban.kanban_columns kc ON kb.board_id = kc.board_id
      WHERE kb.game_id = $1
      GROUP BY kb.board_id, kb.board_name, kb.board_config
    `, [gameId]);
    
    // Get tasks for each board
    const tasksResult = await pool.query(`
      SELECT 
        kt.task_id,
        kt.task_number,
        kt.task_title,
        kt.current_column,
        kt.task_metadata,
        kb.board_id
      FROM kanban.kanban_tasks kt
      JOIN kanban.kanban_boards kb ON kt.board_id = kb.board_id
      WHERE kb.game_id = $1
      ORDER BY kt.task_number
    `, [gameId]);
    
    res.json({
      game: gameResult.rows[0],
      moves: movesResult.rows,
      boards: boardsResult.rows,
      tasks: tasksResult.rows
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Create new game
app.post('/api/games', async (req, res) => {
  try {
    const { gameName, gameType = 'sprint', clientId = 6 } = req.body;
    
    const result = await pool.query(
      'SELECT kanban.create_kanban_game($1, $2, $3)',
      [clientId, gameName, gameType]
    );
    
    const gameId = result.rows[0].create_kanban_game;
    
    // Create a board for this game
    const boardResult = await pool.query(
      'INSERT INTO kanban.kanban_boards (game_id, board_name, board_config) VALUES ($1, $2, $3) RETURNING board_id',
      [gameId, gameName + ' Board', '{"type": "tameflow", "waiting_columns": true}']
    );
    const boardId = boardResult.rows[0].board_id;
    
    // Create complete TameFlow board structure
    await pool.query(
      'SELECT kanban.create_tameflow_board_conversationally($1, $2)',
      [gameId, boardId]
    );
    
    // Broadcast new game creation
    broadcast({
      type: 'GAME_CREATED',
      gameId,
      gameName,
      gameType
    });
    
    res.json({ gameId, gameName, gameType });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Make a move
app.post('/api/games/:gameId/moves', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { moveNotation, moveDescription, boardResponse } = req.body;
    
    const result = await pool.query(
      'SELECT kanban.make_kanban_move($1, $2, $3, $4)',
      [gameId, moveNotation, moveDescription, boardResponse]
    );
    
    const moveId = result.rows[0].make_kanban_move;
    
    // Broadcast move to all clients
    broadcast({
      type: 'MOVE_MADE',
      gameId,
      moveId,
      moveNotation,
      moveDescription,
      boardResponse
    });
    
    res.json({ moveId, moveNotation });
  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
});

// Get conversation turns for a game
app.get('/api/games/:gameId/conversation', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        turn_id,
        content,
        source_type,
        metadata,
        timestamp
      FROM meetings.turns 
      WHERE metadata->>'game_id' = $1
      ORDER BY timestamp
    `, [gameId.toString()]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Request LLM snapshot
app.post('/api/games/:gameId/llm-snapshot', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { reason, confidence = 0.8 } = req.body;
    
    const result = await pool.query(
      'SELECT kanban.request_llm_snapshot($1, NULL, $2, $3)',
      [gameId, reason, confidence]
    );
    
    const snapshotId = result.rows[0].request_llm_snapshot;
    
    // Broadcast LLM snapshot
    broadcast({
      type: 'LLM_SNAPSHOT',
      gameId,
      snapshotId,
      reason,
      confidence
    });
    
    res.json({ snapshotId, reason, confidence });
  } catch (error) {
    console.error('Error requesting LLM snapshot:', error);
    res.status(500).json({ error: 'Failed to request LLM snapshot' });
  }
});

// Create column conversationally
app.post('/api/games/:gameId/columns', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { boardId, columnName, wipLimit, position, skipWaiting } = req.body;
    
    // Use TameFlow column creation function
    const result = await pool.query(
      'SELECT kanban.create_tameflow_column_conversationally($1::INTEGER, $2::INTEGER, $3::TEXT, $4::INTEGER, $5::INTEGER, $6::BOOLEAN)',
      [parseInt(gameId), parseInt(boardId), columnName, wipLimit || null, position || null, skipWaiting || false]
    );
    
    const columnResult = result.rows[0].create_tameflow_column_conversationally;
    
    // Broadcast column creation
    broadcast({
      type: 'COLUMN_CREATED',
      gameId: parseInt(gameId),
      columnResult,
      columnName,
      wipLimit
    });
    
    res.json({ columnResult, columnName });
  } catch (error) {
    console.error('Error creating column:', error);
    res.status(500).json({ error: 'Failed to create column' });
  }
});

// Remove column
app.delete('/api/games/:gameId/columns/:columnId', async (req, res) => {
  try {
    const { gameId, columnId } = req.params;
    
    // Check if column exists and get its name
    const columnCheck = await pool.query(
      'SELECT column_name FROM kanban.kanban_columns WHERE column_id = $1',
      [columnId]
    );
    
    if (columnCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }
    
    const columnName = columnCheck.rows[0].column_name;
    
    // Move any tasks from this column to the first available column
    const moveResult = await pool.query(`
      UPDATE kanban.kanban_tasks 
      SET current_column = (
        SELECT column_name FROM kanban.kanban_columns kc
        JOIN kanban.kanban_boards kb ON kc.board_id = kb.board_id
        WHERE kb.game_id = $1 AND kc.column_id != $2
        ORDER BY kc.column_position LIMIT 1
      )
      WHERE current_column = $3
    `, [gameId, columnId, columnName]);
    
    // Delete the column
    await pool.query(
      'DELETE FROM kanban.kanban_columns WHERE column_id = $1',
      [columnId]
    );
    
    // Broadcast column removal
    broadcast({
      type: 'COLUMN_REMOVED',
      gameId,
      columnId,
      columnName
    });
    
    res.json({ success: true, columnId, columnName });
  } catch (error) {
    console.error('Error removing column:', error);
    res.status(500).json({ error: 'Failed to remove column' });
  }
});

// Create task conversationally
app.post('/api/games/:gameId/tasks', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { boardId, taskTitle, taskType = 'TASK', initialColumn = 'todo' } = req.body;
    
    const result = await pool.query(
      'SELECT kanban.create_task_conversationally($1, $2, $3, $4, $5)',
      [gameId, boardId, taskTitle, taskType, initialColumn]
    );
    
    const taskId = result.rows[0].create_task_conversationally;
    
    // Broadcast task creation
    broadcast({
      type: 'TASK_CREATED',
      gameId,
      taskId,
      taskTitle,
      taskType,
      initialColumn
    });
    
    res.json({ taskId, taskTitle, taskType });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Move task conversationally
app.post('/api/games/:gameId/tasks/:taskId/move', async (req, res) => {
  try {
    const { gameId, taskId } = req.params;
    const { fromColumn, toColumn } = req.body;
    
    const result = await pool.query(
      'SELECT kanban.move_task_conversationally($1, $2, $3, $4)',
      [gameId, taskId, fromColumn, toColumn]
    );
    
    const moveId = result.rows[0].move_task_conversationally;
    
    // Broadcast task move
    broadcast({
      type: 'TASK_MOVED',
      gameId,
      taskId,
      moveId,
      fromColumn,
      toColumn
    });
    
    res.json({ moveId, taskId, fromColumn, toColumn });
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kanban server running on port ${PORT}`);
  console.log(`📡 WebSocket server running on port 8081`);
  console.log(`🔗 Database connected to Supabase`);
  console.log(`🌐 Accessible from Windows at http://<WSL-IP>:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Kanban server...');
  pool.end();
  process.exit(0);
});