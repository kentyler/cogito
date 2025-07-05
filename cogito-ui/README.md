# Cogito UI

An Electron-based interface for conversing with the Cogito database and generating AI-powered insights.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Claude API:**
   - Copy `.env.example` to `.env`
   - Add your Anthropic API key (get one from https://console.anthropic.com/settings/keys)
   ```bash
   cp .env.example .env
   # Edit .env and add your API key
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

## Features

- **Authentication**: Secure login with email/password
- **Multi-client support**: Handle users who belong to multiple clients
- **Conversation summaries**: AI-generated summaries of recent team activity
- **Natural language queries**: Ask questions about conversation patterns and history
- **Cross-platform**: Works on Windows (PowerShell) and Linux (Node.js)

## Architecture

- **Main process** (`main.js`): Handles window creation and IPC communication
- **Renderer** (`renderer.js`): UI logic and user interaction
- **Database handler** (`db-handler.js`): PostgreSQL queries and data retrieval
- **Claude service** (`claude-service.js`): Anthropic API integration for AI features

## Claude Integration

The app uses Claude (via Anthropic API) for:
- Generating summaries of recent conversations
- Analyzing conversation patterns
- Answering natural language queries about team activity

By default, it uses Claude 3 Haiku for fast, cost-effective responses. You can change the model in `.env`.

## Troubleshooting

- **"ANTHROPIC_API_KEY not found"**: Make sure you've created `.env` from `.env.example` and added your API key
- **Database connection errors**: Check that the Supabase connection string in `db-handler.js` is correct
- **No recent content found**: The client may not have conversations in the last 30 days