import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import axios from 'axios';
import KanbanBoard from './components/KanbanBoard';
import GameSelector from './components/GameSelector';
import ConversationPanel from './components/ConversationPanel';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

function App() {
  const [currentGame, setCurrentGame] = useState(null);
  const [games, setGames] = useState([]);
  const [moves, setMoves] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [boardState, setBoardState] = useState({
    columns: {
      'todo': { id: 'todo', title: 'To Do', tasks: [] },
      'in-progress': { id: 'in-progress', title: 'In Progress', tasks: [] },
      'testing': { id: 'testing', title: 'Testing', tasks: [] },
      'done': { id: 'done', title: 'Done', tasks: [] }
    },
    columnOrder: ['todo', 'in-progress', 'testing', 'done']
  });

  // Update board state from complete game data (boards, tasks)
  const updateBoardFromGameData = useCallback((gameData) => {
    const { boards, tasks } = gameData;
    
    if (!boards || boards.length === 0) {
      // Fallback to default if no boards
      setBoardState({
        columns: {
          'todo': { id: 'todo', title: 'To Do', tasks: [] }
        },
        columnOrder: ['todo']
      });
      return;
    }

    // Use the first board for now (could support multiple boards later)
    const board = boards[0];
    setCurrentBoard(board);
    const columns = board.columns || [];
    
    // Build column structure from actual database columns
    const newColumns = {};
    const columnOrder = [];
    
    columns.forEach(col => {
      const columnId = col.column_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      newColumns[columnId] = {
        id: columnId,
        title: col.column_name,
        tasks: [],
        wipLimit: col.wip_limit,
        rules: col.column_rules,
        columnId: col.column_id
      };
      columnOrder.push(columnId);
    });

    // Place tasks in their current columns
    if (tasks) {
      tasks.forEach(task => {
        const columnId = task.current_column?.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (columnId && newColumns[columnId]) {
          newColumns[columnId].tasks.push({
            id: `T${task.task_number}`,
            content: task.task_title,
            type: task.task_metadata?.type || 'TASK',
            taskId: task.task_id
          });
        }
      });
    }

    const newBoardState = {
      columns: newColumns,
      columnOrder: columnOrder
    };

    setBoardState(newBoardState);
  }, []);

  // Fetch game data (moves and conversation)
  const fetchGameData = useCallback(async (gameId) => {
    try {
      const [gameResponse, conversationResponse] = await Promise.all([
        axios.get(`${API_BASE}/games/${gameId}`),
        axios.get(`${API_BASE}/games/${gameId}/conversation`)
      ]);
      
      setCurrentGame(gameResponse.data.game);
      setMoves(gameResponse.data.moves);
      setConversation(conversationResponse.data);
      
      // Parse game data to update board state
      updateBoardFromGameData(gameResponse.data);
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  }, [updateBoardFromGameData]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws;
    let reconnectTimeout;
    
    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:8081');
        
        ws.onopen = () => {
          console.log('🔌 Connected to WebSocket');
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);
          
          if (currentGame && data.gameId === currentGame.game_id) {
            if (data.type === 'MOVE_MADE' || data.type === 'COLUMN_CREATED' || data.type === 'COLUMN_REMOVED') {
              fetchGameData(currentGame.game_id);
            }
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected, will retry in 5s...');
          // Retry connection after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        // Retry connection after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };
    
    connect();
    
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [currentGame, fetchGameData]);

  // Fetch available games
  const fetchGames = async () => {
    try {
      const response = await axios.get(`${API_BASE}/games`);
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  // Handle drag and drop
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = boardState.columns[source.droppableId];
    const finishColumn = boardState.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      // Reordering within same column
      const newTasks = Array.from(startColumn.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      setBoardState({
        ...boardState,
        columns: {
          ...boardState.columns,
          [startColumn.id]: {
            ...startColumn,
            tasks: newTasks
          }
        }
      });
    } else {
      // Moving between columns
      const startTasks = Array.from(startColumn.tasks);
      const [removed] = startTasks.splice(source.index, 1);
      const finishTasks = Array.from(finishColumn.tasks);
      finishTasks.splice(destination.index, 0, removed);

      setBoardState({
        ...boardState,
        columns: {
          ...boardState.columns,
          [startColumn.id]: {
            ...startColumn,
            tasks: startTasks
          },
          [finishColumn.id]: {
            ...finishColumn,
            tasks: finishTasks
          }
        }
      });

      // Make API call to record the move
      if (currentGame && removed.taskId) {
        try {
          await axios.post(`${API_BASE}/games/${currentGame.game_id}/tasks/${removed.taskId}/move`, {
            fromColumn: startColumn.title,
            toColumn: finishColumn.title
          });
        } catch (error) {
          console.error('Error recording move:', error);
          // Could revert the UI state here if needed
        }
      }
    }
  };

  // Create new game
  const createGame = async (gameName) => {
    try {
      const response = await axios.post(`${API_BASE}/games`, {
        gameName,
        gameType: 'sprint'
      });
      
      await fetchGames();
      await fetchGameData(response.data.gameId);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  // Add column to current board
  const handleAddColumn = async (columnData) => {
    if (!currentGame || !currentBoard) return;
    
    try {
      await axios.post(`${API_BASE}/games/${currentGame.game_id}/columns`, {
        boardId: currentBoard.board_id,
        columnName: columnData.columnName,
        wipLimit: columnData.wipLimit,
        skipWaiting: columnData.skipWaiting
      });
      
      // Refresh the game data to show new column
      await fetchGameData(currentGame.game_id);
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  // Remove column from current board
  const handleRemoveColumn = async (columnId) => {
    if (!currentGame) return;
    
    // Check if column has tasks
    const column = boardState.columns[columnId];
    if (column && column.tasks.length > 0) {
      if (!window.confirm(`Column "${column.title}" contains ${column.tasks.length} tasks. Are you sure you want to remove it?`)) {
        return;
      }
    }
    
    try {
      // Use the actual database column ID
      const dbColumnId = column.columnId;
      await axios.delete(`${API_BASE}/games/${currentGame.game_id}/columns/${dbColumnId}`);
      
      // Refresh the game data to show updated columns
      await fetchGameData(currentGame.game_id);
    } catch (error) {
      console.error('Error removing column:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 Conversational Kanban</h1>
        <p>Intelligent workflow with drag & drop</p>
      </header>
      
      <div className="app-content">
        <div className="sidebar">
          <GameSelector
            games={games}
            currentGame={currentGame}
            onSelectGame={fetchGameData}
            onCreateGame={createGame}
          />
          
          {currentGame && (
            <ConversationPanel
              conversation={conversation}
              moves={moves}
              gameId={currentGame.game_id}
            />
          )}
        </div>
        
        <div className="main-content">
          {currentGame ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <KanbanBoard
                boardState={boardState}
                gameId={currentGame.game_id}
                gameName={currentGame.game_name}
                onAddColumn={handleAddColumn}
                onRemoveColumn={handleRemoveColumn}
              />
            </DragDropContext>
          ) : (
            <div className="no-game-selected">
              <h2>Select or create a game to start</h2>
              <p>Choose a game from the sidebar to view the Kanban board</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;