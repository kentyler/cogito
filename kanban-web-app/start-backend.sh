#!/bin/bash

echo "🚀 Starting Kanban backend server on port 3001..."

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
echo "📡 Starting Express server..."
echo "🔗 API endpoint: http://localhost:3001"
echo "🏥 Health check: http://localhost:3001/api/health"
echo ""

node server.js