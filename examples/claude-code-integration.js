#!/usr/bin/env node

/**
 * Claude Code Integration Example
 * 
 * This demonstrates how to integrate automatic conversation recording
 * into a Claude Code-like workflow.
 */

import { AutoConversationRecorder } from '../lib/auto-conversation-recorder.js';

class ClaudeCodeWithRecording {
  constructor() {
    this.recorder = new AutoConversationRecorder();
    this.isInitialized = false;
  }

  async initialize() {
    await this.recorder.initialize();
    this.isInitialized = true;
    
    const sessionInfo = this.recorder.getSessionInfo();
    console.log(`\n🚀 Claude Code started with automatic recording`);
    console.log(`📁 Working on: ${sessionInfo.project.displayName}`);
    console.log(`📝 Session: ${sessionInfo.sessionId}\n`);
  }

  /**
   * Simulate Claude Code processing a user prompt
   * @param {string} userPrompt - The user's input
   * @returns {string} Claude's response
   */
  async processPrompt(userPrompt) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Simulate Claude's response (in real Claude Code, this would be the actual AI response)
    const response = this.generateResponse(userPrompt);
    
    // Automatically record the conversation
    const recordResult = await this.recorder.recordConversation(userPrompt, response, {
      llmModel: 'claude-sonnet-4-20250514'
    });

    // Show any project switching that occurred
    if (recordResult.projectSwitched) {
      console.log(`🔄 Switched to: ${recordResult.currentProject.displayName}`);
    }

    return response;
  }

  /**
   * Simple response generator for demo purposes
   * @param {string} prompt - User prompt
   * @returns {string} Simulated response
   */
  generateResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('project') && (lowerPrompt.includes('change') || lowerPrompt.includes('switch'))) {
      return "I've switched to the requested project. We can now work in that project context.";
    }
    
    if (lowerPrompt.includes('database') || lowerPrompt.includes('schema')) {
      return "Let me help you with the database schema. I'll analyze the current structure and suggest modifications.";
    }
    
    if (lowerPrompt.includes('test') || lowerPrompt.includes('debug')) {
      return "I'll help you test and debug this. Let me run through the diagnostic steps.";
    }
    
    if (lowerPrompt.includes('implement') || lowerPrompt.includes('create')) {
      return "I'll implement that feature for you. Let me break it down into steps and start coding.";
    }
    
    return "I'll help you with that. Let me analyze the request and provide a detailed response.";
  }

  async showSessionSummary() {
    const sessionInfo = this.recorder.getSessionInfo();
    const history = await this.recorder.getSessionHistory();
    
    console.log(`\n📊 Session Summary:`);
    console.log(`   Project: ${sessionInfo.project.displayName}`);
    console.log(`   Session: ${sessionInfo.sessionId}`);
    console.log(`   Total exchanges: ${Math.floor(history.length / 2)}`);
    console.log(`   Total turns: ${history.length}`);
    
    if (history.length > 0) {
      const firstTurn = history[0];
      const lastTurn = history[history.length - 1];
      const duration = new Date(lastTurn.created_at) - new Date(firstTurn.created_at);
      console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    }
  }

  async close() {
    await this.recorder.close();
  }
}

// Demo usage
async function demonstrateClaudeCodeRecording() {
  console.log('🎬 Claude Code with Automatic Recording Demo');
  console.log('=============================================');

  const claudeCode = new ClaudeCodeWithRecording();
  
  try {
    // Simulate a typical Claude Code session
    const prompts = [
      "help me debug the database connection",
      "change project to backstage", 
      "add a new column to the users table",
      "switch to liminal-explorer project",
      "implement a new . command for exploration",
      "test the command functionality"
    ];

    for (const prompt of prompts) {
      console.log(`\n👤 User: ${prompt}`);
      const response = await claudeCode.processPrompt(prompt);
      console.log(`🤖 Claude: ${response}`);
    }

    // Show session summary
    await claudeCode.showSessionSummary();
    
    await claudeCode.close();
    
    console.log('\n✅ Demo completed - all conversations automatically recorded!');
    console.log('\n💡 In real Claude Code integration:');
    console.log('   • This would hook into Claude\\'s actual response generation');
    console.log('   • Every prompt-response pair automatically saved');
    console.log('   • Project context preserved across sessions');
    console.log('   • Full audit trail of all Claude Code usage');

  } catch (error) {
    console.error('❌ Demo error:', error);
    await claudeCode.close();
  }
}

// Run the demonstration
demonstrateClaudeCodeRecording();