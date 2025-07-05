# 🎮 Conversational Kanban Web App

A React-based Kanban board with drag & drop functionality that integrates with your PostgreSQL database and conversation system.

## Features

- **Drag & Drop Interface**: Move tasks between columns with smooth animations
- **Real-time Updates**: WebSocket connection for live collaboration
- **Conversational Intelligence**: Every move becomes a conversation with the board
- **Game-based Workflow**: Track workflow as strategic gameplay with moves and responses
- **LLM Integration**: Request AI snapshots of workflow patterns
- **Database Integration**: Connects to your existing Supabase PostgreSQL database

## Prerequisites

- Node.js 14+ 
- Your existing PostgreSQL database with kanban schema
- Kanban helper functions already installed

## Quick Start

### 1. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies  
cd client && npm install
```

### 2. Start the Application
```bash
# From the kanban-web-app directory
npm run dev
```

This will start:
- **Backend server** on `http://localhost:3001`
- **React frontend** on `http://localhost:3000` 
- **WebSocket server** on `ws://localhost:8080`

### 3. Open in Browser
Navigate to `http://localhost:3000` to see the Kanban board.

## Architecture

### Backend (Express.js)
- REST API for game management
- WebSocket server for real-time updates
- Direct PostgreSQL integration
- Routes for moves, conversations, and LLM snapshots

### Frontend (React)
- Drag & drop with @hello-pangea/dnd
- Real-time WebSocket updates
- Game selector and conversation panel
- Responsive design

### Database Integration
- Uses existing `kanban.*` schema tables
- Leverages conversation system integration
- Calls PostgreSQL functions directly

## API Endpoints

- `GET /api/games` - List all games
- `POST /api/games` - Create new game
- `GET /api/games/:id` - Get game details and moves
- `POST /api/games/:id/moves` - Record a move
- `GET /api/games/:id/conversation` - Get conversation turns
- `POST /api/games/:id/llm-snapshot` - Request LLM snapshot

## Key Components

### KanbanBoard
- Displays columns and tasks
- Handles drag & drop interactions
- Records moves to database

### GameSelector
- Lists available games
- Create new games
- Switch between games

### ConversationPanel
- Shows conversation history
- Displays move sequence
- Request LLM snapshots

## Usage

1. **Create a Game**: Click the '+' button to create a new Kanban game
2. **Drag Tasks**: Move tasks between columns - each move is recorded as a conversation
3. **View Conversation**: See the dialogue between you and the board
4. **Request LLM Snapshots**: Ask AI to analyze workflow patterns
5. **Game History**: Review all moves and board responses

## Conversational Features

- **Every drag & drop** creates a move record
- **Board responds** to each move with contextual feedback  
- **LLM snapshots** capture strategic workflow moments
- **Full integration** with existing conversation system
- **Real-time updates** via WebSocket

## Development

- Frontend: React with modern hooks and drag & drop
- Backend: Express.js with PostgreSQL integration
- Real-time: WebSocket for live collaboration
- Database: Direct SQL function calls for performance
- Styling: Custom CSS with responsive design

The application demonstrates **conversational intelligence** in workflow management - transforming traditional Kanban into an interactive dialogue between human and system.