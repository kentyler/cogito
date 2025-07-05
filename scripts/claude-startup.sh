#!/bin/bash
# Claude startup script - dumps database schema for context
# Add to your .bashrc or .zshrc: source ~/claude-projects/cogito/scripts/claude-startup.sh

COGITO_DIR="$HOME/claude-projects/cogito"

# Function to update schema dump when entering cogito directory
claude_cogito_context() {
    if [[ "$PWD" == *"/cogito"* ]]; then
        echo "📊 Updating database schema dump for Claude context..."
        cd "$COGITO_DIR" && node scripts/dump-database-schema.js > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Schema dump updated: database-schema-current.md"
        else
            echo "❌ Failed to update schema dump"
        fi
    fi
}

# Hook into cd command
cd() {
    builtin cd "$@"
    claude_cogito_context
}

# Run on startup if already in cogito directory
claude_cogito_context