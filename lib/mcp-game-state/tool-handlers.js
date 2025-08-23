export class GameStateToolHandlers {
  constructor(gameStateAgent, dbAgent) {
    this.gameStateAgent = gameStateAgent;
    this.dbAgent = dbAgent;
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

    const declarationText = `Let's start the ${gameName} game`;
    const result = await this.gameStateAgent.processTurn(sessionId, declarationText, clientId);
    
    let gameInfo = null;
    try {
      await this.dbAgent.connect();
      gameInfo = await this.dbAgent.designGames.loadGame(clientId, gameName);
    } catch (error) {
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
}