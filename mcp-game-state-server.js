#!/usr/bin/env node

/**
 * MCP Server for GameStateAgent
 * 
 * Provides Claude Code with tools for design game state management:
 * - mcp__game_state__check_current_state: Check current game state
 * - mcp__game_state__declare_game: Start or declare a design game
 * - mcp__game_state__set_unidentified: Set unidentified mode
 * - mcp__game_state__find_cards: Search for relevant cards
 * - mcp__game_state__get_games: List available games
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { GameStateAgent } from './lib/game-state-agent.js';
import { DatabaseAgent } from './lib/database-agent.js';
import { getDatabaseConfig } from './lib/mcp-game-state/config.js';
import { toolSchemas } from './lib/mcp-game-state/tool-schemas.js';
import { GameStateToolHandlers } from './lib/mcp-game-state/tool-handlers.js';

class GameStateMCPServer {
  constructor() {
    this.config = getDatabaseConfig();
    
    this.server = new Server(
      {
        name: 'game-state-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.gameStateAgent = new GameStateAgent();
    this.dbAgent = new DatabaseAgent();
    this.toolHandlers = new GameStateToolHandlers(this.gameStateAgent, this.dbAgent);
    this.sessionState = new Map();
    
    if (this.config.databaseUrl !== process.env.DATABASE_URL) {
      process.env.DATABASE_URL = this.config.databaseUrl;
    }
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: toolSchemas };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'mcp__game_state__check_current_state':
            return await this.toolHandlers.handleCheckCurrentState(args);
          case 'mcp__game_state__declare_game':
            return await this.toolHandlers.handleDeclareGame(args);
          case 'mcp__game_state__set_unidentified':
            return await this.toolHandlers.handleSetUnidentified(args);
          case 'mcp__game_state__find_cards':
            return await this.toolHandlers.handleFindCards(args);
          case 'mcp__game_state__get_games':
            return await this.toolHandlers.handleGetGames(args);
          case 'mcp__game_state__record_hand':
            return await this.toolHandlers.handleRecordHand(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Tool error (${name}):`, error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]:', error);
    };

    process.on('SIGINT', async () => {
      console.log('\nShutting down MCP Game State Server...');
      await this.dbAgent.close();
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🎮 Game State MCP Server running on stdio');
  }
}

// Start server
const server = new GameStateMCPServer();
server.run().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});