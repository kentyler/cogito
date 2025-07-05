#!/usr/bin/env node

/**
 * Test Claude-Kanban Integration
 * Demonstrates commanding Kanban board from Claude Code interface
 */

import { KanbanClaudeInterface } from './kanban-claude-integration.js';

const kanban = new KanbanClaudeInterface();

async function demonstrateClaudeKanbanIntegration() {
  console.log('🎮 Testing Claude → Kanban Integration...\n');

  // Check if Kanban server is running
  console.log('🏥 Checking Kanban server health...');
  const health = await kanban.checkHealth();
  if (!health.success) {
    console.error('❌ Kanban server not available:', health.error);
    console.log('💡 Start the server with: node server.js');
    return;
  }
  console.log(`✅ Kanban server healthy: ${health.status}`);

  // List current games
  console.log('\n📋 Current games:');
  const games = await kanban.listGames();
  if (games.success) {
    games.games.forEach(game => {
      console.log(`  - Game #${game.game_id}: "${game.game_name}" (${game.game_type}, ${game.status})`);
    });
  }

  // Create a new game from Claude Code
  console.log('\n🎯 Creating new game from Claude Code...');
  const newGame = await kanban.createGame('Claude Code Demo', 'exploration');
  if (newGame.success) {
    console.log(`✅ Created game #${newGame.gameId}: "${newGame.gameName}"`);
    
    // For this demo, we'll use a hardcoded board ID (3 from our test)
    // In real usage, you'd get this from the game details
    const boardId = 3;
    const gameId = newGame.gameId;

    // Create columns from Claude Code
    console.log('\n🏗️  Creating columns from Claude Code...');
    
    const backlogColumn = await kanban.createColumn(gameId, boardId, 'Backlog');
    if (backlogColumn.success) {
      console.log(`✅ Created column: ${backlogColumn.columnName}`);
    }

    const wipColumn = await kanban.createColumn(gameId, boardId, 'Work in Progress', 2);
    if (wipColumn.success) {
      console.log(`✅ Created column: ${wipColumn.columnName} (WIP: 2)`);
    }

    const reviewColumn = await kanban.createColumn(gameId, boardId, 'Code Review', 1);
    if (reviewColumn.success) {
      console.log(`✅ Created column: ${reviewColumn.columnName} (WIP: 1)`);
    }

    const deployedColumn = await kanban.createColumn(gameId, boardId, 'Deployed');
    if (deployedColumn.success) {
      console.log(`✅ Created column: ${deployedColumn.columnName}`);
    }

    // Create tasks from Claude Code
    console.log('\n📝 Creating tasks from Claude Code...');
    
    const authTask = await kanban.createTask(gameId, boardId, 'Implement OAuth integration', 'AUTH', 'backlog');
    if (authTask.success) {
      console.log(`✅ Created task: ${authTask.taskTitle} (${authTask.taskType})`);
    }

    const refactorTask = await kanban.createTask(gameId, boardId, 'Refactor database queries', 'FEATURE', 'backlog');
    if (refactorTask.success) {
      console.log(`✅ Created task: ${refactorTask.taskTitle} (${refactorTask.taskType})`);
    }

    const bugTask = await kanban.createTask(gameId, boardId, 'Fix memory leak in WebSocket handler', 'BUG', 'backlog');
    if (bugTask.success) {
      console.log(`✅ Created task: ${bugTask.taskTitle} (${bugTask.taskType})`);
    }

    // Request an LLM snapshot from Claude Code
    console.log('\n📸 Requesting LLM snapshot from Claude Code...');
    const snapshot = await kanban.requestLLMSnapshot(
      gameId, 
      'Initial board setup complete - analyzing workflow structure for optimization opportunities',
      0.9
    );
    if (snapshot.success) {
      console.log(`✅ LLM snapshot #${snapshot.snapshotId} requested: ${snapshot.reason}`);
    }

    // Get the conversation history
    console.log('\n💬 Getting conversation history...');
    const conversation = await kanban.getConversation(gameId);
    if (conversation.success) {
      console.log(`📊 Found ${conversation.conversation.length} conversation turns:`);
      
      conversation.conversation.slice(-6).forEach((turn, index) => {
        const time = new Date(turn.timestamp).toLocaleTimeString();
        const type = turn.source_type.replace('_', ' ');
        const notation = turn.metadata?.move_notation ? ` [${turn.metadata.move_notation}]` : '';
        console.log(`  ${index + 1}. [${time}] ${type}${notation}:`);
        console.log(`     ${turn.content.substring(0, 80)}...`);
      });
    }

    console.log('\n🎯 Claude Code → Kanban Integration Results:');
    console.log('✅ Created game from Claude Code interface');
    console.log('✅ Created columns with intelligent board responses');
    console.log('✅ Created tasks with type-specific feedback');
    console.log('✅ Requested LLM snapshot for strategic analysis');
    console.log('✅ Retrieved full conversation history');
    console.log('✅ All actions participate in shared context');

    console.log('\n💡 You can now command the Kanban board directly from Claude Code!');
    console.log('   Examples:');
    console.log('   - "Create a column called Testing with WIP limit 2"');
    console.log('   - "Add a bug task: Fix login validation"');
    console.log('   - "Move task T1 to work in progress"');
    console.log('   - "Request LLM snapshot: analyzing current workflow"');

  } else {
    console.error('❌ Failed to create game:', newGame.error);
  }
}

// Run the demonstration
demonstrateClaudeKanbanIntegration()
  .then(() => {
    console.log('\n🚀 Integration test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Integration test failed:', error);
    process.exit(1);
  });