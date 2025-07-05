#!/bin/bash

echo "🎮 Starting Conversational Kanban Web App..."
echo "📊 Database: PostgreSQL via Supabase"
echo "🖥️  Frontend: React with drag & drop"
echo "🔗 Backend: Express.js + WebSocket"
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Please run this script from the kanban-web-app directory"
    exit 1
fi

# Start the backend server
echo "🚀 Starting backend server (port 3001)..."
node server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Test the health endpoint
echo "🏥 Testing server health..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend server is healthy"
else
    echo "❌ Backend server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Start the React development server
echo "🎨 Starting React frontend (port 3000)..."
echo "📱 Open http://localhost:3000 in your browser"
echo ""
echo "🎯 Features available:"
echo "  • Drag & drop Kanban board"
echo "  • Real-time conversation with board"
echo "  • Game creation and selection"
echo "  • LLM snapshot requests"
echo "  • WebSocket live updates"
echo ""
echo "💡 Tip: Create a new game to start playing!"
echo ""

cd client && npm start

# Cleanup when script exits
trap "kill $SERVER_PID 2>/dev/null" EXIT