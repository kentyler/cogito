export const toolSchemas = [
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
];