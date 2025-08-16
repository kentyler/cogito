# Game State MCP Server Setup

This MCP (Model Context Protocol) server provides Claude Code with tools for design game state management while you work.

## What It Does

The GameState MCP server enables Claude Code to:
- **Track design game state** across your coding sessions
- **Enforce explicit game declarations** - you're either playing a specific game or in unidentified mode
- **Access design cards/patterns** from previous successful implementations
- **Record successful card combinations** for future reuse

## Local Development

The MCP server runs in **local development mode** and always uses your local `.env` DATABASE_URL:
- **All local work** → Development database (with _2 suffix)  
- **Production deployments** → Use production environment variables
- **Git branch is shown for context** but doesn't affect database selection locally

This keeps local development simple and consistent.

## Setup Instructions

### 1. Install Dependencies
```bash
cd /home/ken/claude-projects/cogito
npm install  # MCP SDK should already be installed
```

### 2. Configure Claude Code

Copy the MCP server configuration to Claude Code's config directory:

```bash
# For Linux/WSL
mkdir -p ~/.config/Claude
cp claude_desktop_config.json ~/.config/Claude/claude_desktop_config.json

# For macOS
mkdir -p ~/Library/Application\ Support/Claude
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# For Windows
mkdir -p %APPDATA%/Claude
copy claude_desktop_config.json %APPDATA%/Claude/claude_desktop_config.json
```

### 3. Test the Server

Test that the MCP server starts correctly:
```bash
node mcp-game-state-server.js
# Should show: "🎮 Game State MCP Server running on stdio"
# Press Ctrl+C to stop
```

### 4. Restart Claude Code

Restart Claude Code for it to pick up the new MCP server configuration.

## Usage in Claude Code

Once set up, you can use these MCP tools in your Claude Code sessions:

### Check Current Game State
```
Use the mcp__game_state__check_current_state tool to see what game we're currently playing.
```

### Start a Design Game
```
Use mcp__game_state__declare_game with gameName "header-redesign" to start tracking this design work.
```

### Set Unidentified Mode
```
Use mcp__game_state__set_unidentified when we're exploring without a specific game framework.
```

### Find Relevant Cards
```
Use mcp__game_state__find_cards with searchTerms "alignment CSS flexbox" to find relevant design patterns.
```

### List Available Games
```
Use mcp__game_state__get_games to see all design games for this client.
```

### Record Successful Patterns
```
Use mcp__game_state__record_hand with cards ["flexbox-header", "consistent-styling"] and outcome "success" to save this combination.
```

## Recommended Workflow

1. **Start sessions with game check**:
   - "Use the check current state tool to see our game status"

2. **Declare your approach**:
   - For structured work: "Use declare game tool with 'button-styling' as the game name"  
   - For exploration: "Use set unidentified mode tool since we're exploring"

3. **Find relevant patterns**:
   - "Use find cards tool to search for 'responsive design' patterns"

4. **Record successes**:
   - "Use record hand tool to save the cards we just successfully combined"

## Troubleshooting

### Server Won't Start
- Check that Node.js 18+ is installed: `node --version`
- Verify all dependencies: `npm install`
- Check console output for specific errors

### Claude Code Can't Find Server
- Verify config file is in the correct location for your OS
- Check file paths in the config are absolute and correct
- Restart Claude Code completely after config changes

### Database Connection Issues  
- Ensure the `.env` file has correct database credentials
- Test database connectivity: `node -e "import('./lib/database-agent.js').then(db => db.dbAgent.connect())"`

## Game State Philosophy

The system enforces two simple states:
- **Identified Game**: We've declared which design challenge we're tackling
- **Unidentified Mode**: We've explicitly acknowledged exploratory work

This prevents "implicit mode" where we're working without conscious awareness of our approach.

## Example Session

```
User: Let's redesign the navigation component
Claude: Let me check our current game state first.

[Uses mcp__game_state__check_current_state]

I see we don't have a declared game state. Should we:
1. Start a "navigation-redesign" game to track patterns?
2. Work in unidentified mode for exploration?

User: Let's start the navigation redesign game
Claude: [Uses mcp__game_state__declare_game with "navigation-redesign"]

Great! I've started tracking the "navigation-redesign" game. Let me also search for relevant design cards we've used before.

[Uses mcp__game_state__find_cards with "navigation responsive menu"]

I found 3 relevant cards from previous games:
- responsive-breakpoints: Mobile-first navigation patterns (♠️)
- hamburger-menu: Collapsible menu implementation (♦️)  
- accessibility-focus: Keyboard navigation support (♣️)

Now let's work on the redesign...
```

This creates explicit game awareness while maintaining natural conversation flow.