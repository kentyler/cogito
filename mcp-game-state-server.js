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
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { execSync } from 'child_process';

// Local development always uses dev database
function getDatabaseConfig() {
  const gitBranch = getGitBranch();
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment variables');
  }
  
  console.error(`🔧 Git Branch: ${gitBranch} → Local Dev Environment`);
  
  // Log which database we're connecting to (safely)
  const dbInfo = new URL(databaseUrl);
  const dbName = dbInfo.pathname.slice(1);
  const isDevDb = dbName.includes('dev') || databaseUrl.includes('dev');
  console.error(`🗄️  Database: ${dbInfo.hostname}/${dbName} (${isDevDb ? 'DEV' : 'PROD'})`);
  
  return {
    environment: 'development',
    gitBranch: gitBranch,
    databaseUrl: databaseUrl,
    isDevDb: isDevDb
  };
}

// Get git branch for informational purposes
function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

class GameStateMCPServer {
  constructor() {
    // Get environment configuration
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
    this.sessionState = new Map(); // Simple session tracking for MCP context
    
    // Override database URL if needed
    if (this.config.databaseUrl !== process.env.DATABASE_URL) {
      process.env.DATABASE_URL = this.config.databaseUrl;
    }
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'mcp__game_state__check_current_state',
            description: 'Check the current design game state for this session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session identifier (optional, will use default if not provided)',
                },
              },
            },
          },
          {
            name: 'mcp__game_state__declare_game',
            description: 'Declare that we are starting or playing a specific design game',
            inputSchema: {
              type: 'object',
              properties: {
                gameName: {
                  type: 'string',
                  description: 'Name of the design game (e.g., "header-redesign", "button-styling")',
                },
                ude: {
                  type: 'string',
                  description: 'User Desired Experience - what we want to achieve (optional)',
                },
                clientId: {
                  type: 'number',
                  description: 'Client ID (defaults to 1)',
                },
                sessionId: {
                  type: 'string',
                  description: 'Session identifier (optional)',
                },
              },
              required: ['gameName'],
            },
          },
          {
            name: 'mcp__game_state__set_unidentified',
            description: 'Declare that we are working in unidentified mode (exploratory work)',
            inputSchema: {
              type: 'object',
              properties: {
                reason: {
                  type: 'string',
                  description: 'Reason for unidentified mode (optional)',
                },
                sessionId: {
                  type: 'string',
                  description: 'Session identifier (optional)',
                },
              },
            },
          },
          {
            name: 'mcp__game_state__find_cards',
            description: 'Search for design cards/patterns relevant to current work',
            inputSchema: {
              type: 'object',
              properties: {
                searchTerms: {
                  type: 'string',
                  description: 'Search terms (e.g., "alignment", "styling", "responsive")',
                },
                clientId: {
                  type: 'number',
                  description: 'Client ID (defaults to 1)',
                },
              },
              required: ['searchTerms'],
            },
          },
          {
            name: 'mcp__game_state__get_games',
            description: 'List available design games for a client',
            inputSchema: {
              type: 'object',
              properties: {
                clientId: {
                  type: 'number',
                  description: 'Client ID (defaults to 1)',
                },
                status: {
                  type: 'string',
                  description: 'Filter by status (active, paused, complete, archived)',
                },
              },
            },
          },
          {
            name: 'mcp__game_state__record_hand',
            description: 'Record a "hand" (combination of cards played) in the current game',
            inputSchema: {
              type: 'object',
              properties: {
                cards: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of card names played together',
                },
                outcome: {
                  type: 'string',
                  description: 'Outcome of playing these cards (success, failure, mixed)',
                },
                notes: {
                  type: 'string',
                  description: 'Notes about what happened (optional)',
                },
                clientId: {
                  type: 'number',
                  description: 'Client ID (defaults to 1)',
                },
                sessionId: {
                  type: 'string',
                  description: 'Session identifier (optional)',
                },
              },
              required: ['cards', 'outcome'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'mcp__game_state__check_current_state':
            return await this.handleCheckCurrentState(args);
          
          case 'mcp__game_state__declare_game':
            return await this.handleDeclareGame(args);
          
          case 'mcp__game_state__set_unidentified':
            return await this.handleSetUnidentified(args);
          
          case 'mcp__game_state__find_cards':
            return await this.handleFindCards(args);
          
          case 'mcp__game_state__get_games':
            return await this.handleGetGames(args);
          
          case 'mcp__game_state__record_hand':
            return await this.handleRecordHand(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        console.error(`Tool error (${name}):`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async handleCheckCurrentState(args) {
    const sessionId = args.sessionId || 'default-session';
    const currentState = this.gameStateAgent.getSessionState(sessionId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sessionId,
            currentState: currentState || { type: 'undeclared' },
            message: currentState 
              ? `Current game state: ${currentState.type === 'identified' ? `Playing "${currentState.displayName}"` : 'Unidentified mode'}`
              : 'No game state declared for this session'
          }, null, 2),
        },
      ],
    };
  }

  async handleDeclareGame(args) {
    const sessionId = args.sessionId || 'default-session';
    const clientId = args.clientId || 1;
    const { gameName, ude } = args;

    // Simulate the processTurn call to trigger game state change
    const declarationText = `Let's start the ${gameName} game`;
    const result = await this.gameStateAgent.processTurn(sessionId, declarationText, clientId);
    
    // Try to load or create the game in the database
    let gameInfo = null;
    try {
      await this.dbAgent.connect();
      gameInfo = await this.dbAgent.designGames.loadGame(clientId, gameName);
    } catch (error) {
      // Game doesn't exist, create it if UDE provided
      if (ude) {
        try {
          gameInfo = await this.dbAgent.designGames.createGame(clientId, gameName, ude);
        } catch (createError) {
          console.warn('Could not create game in database:', createError.message);
        }
      }
    } finally {
      await this.dbAgent.close();
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId,
            gameState: result.currentState,
            gameInfo: gameInfo ? {
              id: gameInfo.id,
              status: gameInfo.status || gameInfo.game_data?.currentStatus,
              cardsCount: gameInfo.game_data ? Object.keys(gameInfo.game_data.cards || {}).length : 0
            } : null,
            message: result.message
          }, null, 2),
        },
      ],
    };
  }

  async handleSetUnidentified(args) {
    const sessionId = args.sessionId || 'default-session';
    const reason = args.reason || 'explicit_declaration';

    const declarationText = 'We are working in unidentified mode';
    const result = await this.gameStateAgent.processTurn(sessionId, declarationText, 1);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId,
            gameState: result.currentState,
            message: result.message,
            reason
          }, null, 2),
        },
      ],
    };
  }

  async handleFindCards(args) {
    const clientId = args.clientId || 1;
    const { searchTerms } = args;

    try {
      await this.dbAgent.connect();
      const cards = await this.gameStateAgent.findRelevantCards(clientId, searchTerms);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              searchTerms,
              cardsFound: cards.length,
              cards: cards.map(card => ({
                key: card.key,
                game: card.game,
                suit: card.suit,
                pattern: card.pattern,
                forces: card.forces
              }))
            }, null, 2),
          },
        ],
      };
    } finally {
      await this.dbAgent.close();
    }
  }

  async handleGetGames(args) {
    const clientId = args.clientId || 1;
    const status = args.status || null;

    try {
      await this.dbAgent.connect();
      const games = await this.gameStateAgent.getAvailableGames(clientId);
      
      const filteredGames = status 
        ? games.filter(game => game.status === status)
        : games;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              clientId,
              totalGames: games.length,
              filteredGames: filteredGames.length,
              games: filteredGames
            }, null, 2),
          },
        ],
      };
    } finally {
      await this.dbAgent.close();
    }
  }

  async handleRecordHand(args) {
    const sessionId = args.sessionId || 'default-session';
    const clientId = args.clientId || 1;
    const { cards, outcome, notes } = args;

    // Get current game state
    const currentState = this.gameStateAgent.getSessionState(sessionId);
    if (!currentState || currentState.type !== 'identified') {
      throw new Error('No active game to record hand in. Declare a game first.');
    }

    try {
      await this.dbAgent.connect();
      const result = await this.dbAgent.designGames.recordHand(
        clientId,
        currentState.gameName,
        cards,
        outcome,
        notes
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              gameName: currentState.gameName,
              hand: {
                cards,
                outcome,
                notes,
                timestamp: result.timestamp
              }
            }, null, 2),
          },
        ],
      };
    } finally {
      await this.dbAgent.close();
    }
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